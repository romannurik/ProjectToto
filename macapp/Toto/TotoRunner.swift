// Copyright 2016 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import Foundation

class TotoRunner {
    static let sharedInstance = TotoRunner()
    
    class Event {
        static let StatusChanged = "statusChanged"
        static let LoadError = "loadError"
    }

    enum Status {
        case None
        case Loading
        case Running
        case Error
    }
    
    let events = EventManager()

    private var prototypePath: String? = nil
    private var task: NSTask? = nil
    private var unprocessedStdout: String = ""
    
    private var _status: Status = .None {
        didSet {
            events.trigger(Event.StatusChanged)
        }
    }
    var status: Status {
        return self._status;
    }
    
    private var _title: String? = nil
    var title: String? {
        return self._status != .None ? self._title : nil;
    }
    
    private var _thumbnail: String? = nil
    var thumbnailURL: NSURL? {
        if self._status != .Running {
            return nil
        }

        if let thumb = self._thumbnail, protoPath = self.prototypePath {
            return NSURL(fileURLWithPath: protoPath)
                .URLByAppendingPathComponent("build")
                .URLByAppendingPathComponent(thumb)
        }
        
        return nil
    }
    
    private var _localUrl: String? = nil
    var localUrl: String? {
        return self._status == .Running ? self._localUrl : nil;
    }
    
    private var _remoteUrl: String? = nil
    var remoteUrl: String? {
        return self._status == .Running ? self._remoteUrl : nil;
    }
    
    func killCurrentPrototype() {
        if self.task != nil {
            self.task!.terminate()
        }

        self.task = nil

        _status = .None
    }
    
    func loadPrototype(var path: String) {
        if self._status == .Running && self.prototypePath == path {
            return
        }

        killCurrentPrototype()

        self.unprocessedStdout = ""

        var title = (path as NSString).lastPathComponent
        if title == "toto-prototype" {
            title = ((path as NSString).stringByDeletingLastPathComponent as NSString).lastPathComponent
        }

        self._title = title

        let fm = NSFileManager.defaultManager()
        var isDirectory: ObjCBool = false
        if !fm.fileExistsAtPath(path, isDirectory: &isDirectory) {
            events.trigger(Event.LoadError)
            return
        }
        
        if !isDirectory {
            path = (path as NSString).stringByDeletingLastPathComponent
        }
        
        let outPipe = NSPipe()
        
        var fh = outPipe.fileHandleForReading
        fh.waitForDataInBackgroundAndNotify()
        NSNotificationCenter.defaultCenter().addObserver(
            self, selector: "receivedStdout:", name: NSFileHandleDataAvailableNotification, object: fh)

        let errPipe = NSPipe()
        fh = errPipe.fileHandleForReading
        fh.waitForDataInBackgroundAndNotify()
        NSNotificationCenter.defaultCenter().addObserver(
            self, selector: "receivedStderr:", name: NSFileHandleDataAvailableNotification, object: fh)

        let task = NSTask()
        task.currentDirectoryPath = path
        task.standardOutput = outPipe
        task.standardError = errPipe
        
        task.launchPath = NSBundle.mainBundle().resourceURL!.URLByAppendingPathComponent("toto/bin/toto_packaged").path
        task.launch()

        self.prototypePath = path
        self.task = task

        _status = .Loading
    }
    
    @objc private func receivedStderr(notif: NSNotification) {
        let fh = notif.object!
        let data = fh.availableData!
        if data.length > 0 {
            NSLog("%@", String(data: data, encoding: NSUTF8StringEncoding)!)
            fh.waitForDataInBackgroundAndNotify()
        }
    }
    
    @objc private func receivedStdout(notif: NSNotification) {
        let fh = notif.object!
        let data = fh.availableData!
        if data.length > 0 {
            let dataStr = String(data: data, encoding: NSUTF8StringEncoding)!
            unprocessedStdout += dataStr
            processOutput()
            NSLog("%@", dataStr)
            fh.waitForDataInBackgroundAndNotify()
        }
    }
   
    private func processOutput() {
        var out = unprocessedStdout as String
        while true {
            let range: Range<String.Index>! = out.rangeOfString("\n")
            if range == nil {
                break
            }

            let cmd = out.substringToIndex(range.endIndex.advancedBy(-1))
            var parts = cmd.componentsSeparatedByString(":")
            if parts.count >= 2 {
                let (key, value) = (parts[0], parts[1..<parts.count].joinWithSeparator(":"))
                switch key {
                case "proto_path":
                    self.prototypePath = value
                case "title":
                    self._title = value
                case "thumbnail":
                    self._thumbnail = value
                case "local_url":
                    self._localUrl = value
                case "external_url":
                    self._remoteUrl = value
                case "status":
                    switch value {
                    case "running":
                        self._status = .Running
                    case "error":
                        self._status = .Error
                    default: break
                    }
                default: break
                }
            }
            
            out = out.substringFromIndex(range.startIndex.advancedBy(1))
        }

        unprocessedStdout = out
    }
}