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

#import <Cocoa/Cocoa.h>

@interface DummyNibOwner : NSObject


// View bindings go here

//@property IBOutlet NSButton *cancelButton;
@property IBOutlet NSTextField *layerNameLabel;
@property IBOutlet NSVisualEffectView *headingVisualEffectView;
@property IBOutlet NSSegmentedControl *tabIndicatorsView;
@property IBOutlet NSTabView *tabView;

// Hotspot tab

    // "Show/hide layers" option
    @property IBOutlet NSButton *hotspotShowHideButton;
    @property IBOutlet NSView *hotspotShowHideGroup;

        // Item template
        @property IBOutlet NSView *hotspotShowHideItemTemplateGroup;

        // Add new box
        @property IBOutlet NSView *hotspotShowHideAddGroup;
        @property IBOutlet NSComboBox *hotspotShowHideAddLayerField;
        @property IBOutlet NSSegmentedControl *hotspotShowHideAddButtonGroup;
        @property IBOutlet NSImageView *hotspotShowHideAddPreview;

    // "Navigate to screen" option
    @property IBOutlet NSButton *hotspotNavigateButton;
    @property IBOutlet NSView *hotspotNavigateGroup;
    @property IBOutlet NSComboBox *hotspotNavigateScreenField;
    @property IBOutlet NSImageView *hotspotNavigateScreenPreview;

    // "None" option
    @property IBOutlet NSButton *hotspotNoneButton;

// Behaviors tab
@property IBOutlet NSPopUpButton *behaviorsScrollTypeButton;
@property IBOutlet NSButton *behaviorsPagerButton;
@property IBOutlet NSPopUpButton *behaviorsAnimationTypeButton;


// More tab
@property IBOutlet NSButton *moreExportDefaultButton;
@property IBOutlet NSButton *moreExportExcludeButton;
@property IBOutlet NSButton *moreExportIncludeButton;
@property IBOutlet NSButton *moreExportFlattenButton;


// End of view bindings


@end

@implementation DummyNibOwner
@end