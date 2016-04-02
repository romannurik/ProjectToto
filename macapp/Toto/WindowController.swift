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

import Cocoa

class WindowController: NSWindowController, NSWindowDelegate, NSDraggingDestination {
    
    let mainStoryboard = NSStoryboard(name: "Main", bundle: nil)

    var emptyStateViewController: EmptyStateViewController! = nil
    var prototypeViewController: PrototypeViewController! = nil
    
    override func windowDidLoad() {
        let window = self.window!
        window.titleVisibility = .Hidden;
        window.titlebarAppearsTransparent = true;
        window.appearance = NSAppearance(named: NSAppearanceNameVibrantLight)
        window.movableByWindowBackground = true;
        window.delegate = self;
        window.registerForDraggedTypes([NSFilenamesPboardType]);

        emptyStateViewController = contentViewController as! EmptyStateViewController
        prototypeViewController = mainStoryboard.instantiateControllerWithIdentifier("prototypeViewController") as! PrototypeViewController

        TotoRunner.sharedInstance.events.listenTo(TotoRunner.Event.StatusChanged, action: {
            //contentViewController?.performSegueWithIdentifier("load_prototype", sender: self);
            if TotoRunner.sharedInstance.status == .None {
                self.contentViewController = self.emptyStateViewController
            } else {
                self.contentViewController = self.prototypeViewController
            }
        })
    }
    
    func draggingEntered(sender: NSDraggingInfo) -> NSDragOperation {
        if !sender.draggingPasteboard().types!.contains(NSFilenamesPboardType) {
            return .None;
        }

        emptyStateViewController.setHighlighted(true)
        return .Generic;
    }
    
    func draggingExited(sender: NSDraggingInfo?) {
        emptyStateViewController.setHighlighted(false)
    }
    
    func draggingEnded(sender: NSDraggingInfo?) {
        self.draggingExited(sender);
    }
    
    func prepareForDragOperation(sender: NSDraggingInfo) -> Bool {
        return true;
    }
    
    func performDragOperation(sender: NSDraggingInfo) -> Bool {
        let files = sender.draggingPasteboard().propertyListForType(NSFilenamesPboardType) as! [String];
        TotoRunner.sharedInstance.loadPrototype(files[0])
        return true;
    }
}
