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

class EmptyStateViewController: NSViewController {
    
    @IBOutlet weak var dragBox: NSImageView!
    @IBOutlet weak var primaryLabel: NSTextField!
    @IBOutlet weak var secondaryLabel: NSTextField!
    
    private var originalPrimaryTextColor: NSColor = NSColor.blackColor()
    private var originalSecondaryTextColor: NSColor = NSColor.blackColor()
    
    override func viewDidLoad() {
        self.originalPrimaryTextColor = primaryLabel.textColor!
        self.originalSecondaryTextColor = secondaryLabel.textColor!
    }

    func setHighlighted(highlighted: Bool) {
        primaryLabel.textColor = highlighted ? Colors.ActiveBlue : originalPrimaryTextColor
        secondaryLabel.textColor = highlighted ? Colors.ActiveBlue : originalSecondaryTextColor
        dragBox.image = NSImage(named: highlighted ? "drag_box_active" : "drag_box")
    }
}

