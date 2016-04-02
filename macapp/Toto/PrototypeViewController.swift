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

class PrototypeViewController: NSViewController {

    @IBOutlet weak var cancelButton: NSButton!
    @IBOutlet weak var previewImage: NSImageView!
    @IBOutlet weak var titleLabel: NSTextField!
    @IBOutlet weak var statusLabel: NSTextField!

    @IBOutlet weak var loadingSpinner: NSProgressIndicator!
    @IBOutlet weak var detailsScrollView: NSScrollView!
    
    private var originalStatusTextColor = NSColor.blackColor()
    private var originalStatusTextFont = NSFont.systemFontOfSize(NSFont.smallSystemFontSize())
    private var activeStatusTextFont = NSFont.boldSystemFontOfSize(NSFont.smallSystemFontSize())
    
    var detailsTextView: NSTextView {
        return detailsScrollView.contentView.documentView as! NSTextView
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        originalStatusTextColor = self.statusLabel.textColor!
        originalStatusTextFont = self.statusLabel.font!
        activeStatusTextFont = NSFont.boldSystemFontOfSize(originalStatusTextFont.pointSize)

        TotoRunner.sharedInstance.events.listenToAndCall(
            TotoRunner.Event.StatusChanged, action: updateUi)
    }
    
    func updateUi() {
        let status = TotoRunner.sharedInstance.status
        self.loadingSpinner.hidden = (status != .Loading)
        self.loadingSpinner.startAnimation(nil)
        self.detailsTextView.hidden = (status != .Running)
        self.previewImage.hidden = (status != .Running)

        self.titleLabel.stringValue = TotoRunner.sharedInstance.title ?? "<Unknown Prototype>"
        
        self.statusLabel.stringValue = (status == .Running) ? "Serving prototype" : "Loading…"
        self.statusLabel.textColor = (status == .Running) ? Colors.SuccessGreen : originalStatusTextColor
        self.statusLabel.font = (status == .Running) ? activeStatusTextFont : originalStatusTextFont

        self.cancelButton.title = (status == .Loading) ? "Cancel" : "Stop server"
        self.cancelButton.sizeToFit()

        if status == .Running {
            let localUrl = TotoRunner.sharedInstance.localUrl!
            let remoteUrl = TotoRunner.sharedInstance.remoteUrl!

            // show details text w/ links
            let html = "Local URL<br>" +
                "<a href=\"\(localUrl)\">\(localUrl)</a><br><br>" +
                "Remote URL<br>" +
                "<a href=\"\(remoteUrl)\">\(remoteUrl)</a><br>"

            let attributedString = NSAttributedString(
                HTML: html.dataUsingEncoding(NSUTF8StringEncoding)!,
                documentAttributes: nil)!

            self.detailsTextView.textStorage!.setAttributedString(attributedString)
            self.detailsTextView.textStorage!.font = NSFont.systemFontOfSize(13)
            self.detailsTextView.textContainer!.lineFragmentPadding = 0

            // show preview image
            self.previewImage.image = nil
            if let thumb = TotoRunner.sharedInstance.thumbnailURL {
                self.previewImage.image = NSImage(contentsOfURL: thumb)
            }
        }
    }
    
    @IBAction func cancelButtonClick(sender: AnyObject) {
        TotoRunner.sharedInstance.killCurrentPrototype()
    }
}

