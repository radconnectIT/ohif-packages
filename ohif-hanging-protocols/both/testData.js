function getDefaultProtocol() {
    var protocol = new HP.Protocol('Default');
    protocol.id = 'defaultProtocol';
    protocol.locked = true;

    var oneByOne = new HP.ViewportStructure('grid', {
        rows: 1,
        columns: 1
    });

    var viewport = new HP.Viewport();
    var first = new HP.Screen(oneByOne, 'oneByOne');
    first.viewports.push(viewport);

    var stage = new HP.Stage('Stage 1');
    stage.setMainScreen(first);
    protocol.stages.push(stage);

    HP.defaultProtocol = protocol;
    return HP.defaultProtocol;
}

function getMRTwoByTwoTest() {
    var proto = new HP.Protocol('MR_TwoByTwo');
    proto.id = 'MR_TwoByTwo';
    proto.locked = true;
    // Use http://localhost:3000/viewer/1.2.840.113619.2.5.1762583153.215519.978957063.78

    var studyInstanceUid = new HP.ProtocolMatchingRule('studyInstanceUid', {
        equals: {
            value: '1.2.840.113619.2.5.1762583153.215519.978957063.78'
        }
    }, true);

    proto.addProtocolMatchingRule(studyInstanceUid);

    var oneByTwo = new HP.ViewportStructure('grid', {
        rows: 1,
        columns: 2
    });

    // Stage 1
    var left = new HP.Viewport();
    var right = new HP.Viewport();

    var firstSeries = new HP.SeriesMatchingRule('seriesNumber', {
        equals: {
            value: 1
        }
    });

    var secondSeries = new HP.SeriesMatchingRule('seriesNumber', {
        equals: {
            value: 2
        }
    });

    var thirdImage = new HP.ImageMatchingRule('instanceNumber', {
        equals: {
            value: 3
        }
    });

    left.seriesMatchingRules.push(firstSeries);
    left.imageMatchingRules.push(thirdImage);

    right.seriesMatchingRules.push(secondSeries);
    right.imageMatchingRules.push(thirdImage);

    var first = new HP.Screen(oneByTwo, 'oneByTwo');
    first.viewports.push(left);
    first.viewports.push(right);

    var firstStage = new HP.Stage('Stage 1');
    firstStage.setMainScreen(first);
    proto.stages.push(firstStage);

    // Stage 2
    var twoByOne = new HP.ViewportStructure('grid', {
        rows: 2,
        columns: 1
    });
    var left2 = new HP.Viewport();
    var right2 = new HP.Viewport();

    var fourthSeries = new HP.SeriesMatchingRule('seriesNumber', {
        equals: {
            value: 4
        }
    });

    var fifthSeries = new HP.SeriesMatchingRule('seriesNumber', {
        equals: {
            value: 5
        }
    });

    left2.seriesMatchingRules.push(fourthSeries);
    left2.imageMatchingRules.push(thirdImage);
    right2.seriesMatchingRules.push(fifthSeries);
    right2.imageMatchingRules.push(thirdImage);

    var second = new HP.Screen(twoByOne, 'twoByOne');
    second.viewports.push(left2);
    second.viewports.push(right2);

    var secondStage = new HP.Stage('Stage 2');
    secondStage.setMainScreen(second);
    proto.stages.push(secondStage);

    HP.testProtocol = proto;
    return HP.testProtocol;
}

function getDemoProtocols() {

    HP.demoProtocols = [];

        /**
     * Demo #1
     */
    HP.demoProtocols.push({
        "id": "demoProtocol1",
        "name": "DFCI-CT-CHEST-COMPARE",
        "protocolMatchingRules": [
            {
                "weight": 2,
                "required": false,
                "attribute": "x00081030",
                "constraint": {
                    "contains": {
                        "value": "DFCI CT CHEST"
                    }
                }
            }
        ],
        "stages": [
            {
                "name": "Stage A",
                "screens": [
                    {
                        "name": "Screen 1",
                        "viewportStructure": {
                            "type": "grid",
                            "properties": {
                                "rows": 1,
                                "columns": 1
                            },
                            "layoutTemplateName": "gridLayout"
                        },
                        "viewports": [
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "2.0"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [

                                ]
                            }
                        ]
                    },
                    {
                        "name": "Screen 2",
                        "viewportStructure": {
                            "type": "grid",
                            "properties": {
                                "rows": 1,
                                "columns": 1
                            },
                            "layoutTemplateName": "gridLayout"
                        },
                        "viewports": [
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "2.0"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "abstractPriorValue",
                                        "constraint": {
                                            "equals": {
                                                "value": 4
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                "name": "Stage B",
                "screens": [
                    {
                        "name": "Screen 1",
                        "viewportStructure": {
                            "type": "grid",
                            "properties": {
                                "rows": 1,
                                "columns": 1
                            },
                            "layoutTemplateName": "gridLayout"
                        },
                        "viewports": [
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "3.0"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [

                                ]
                            }
                        ]
                    },
                    {
                        "name": "Screen 2",
                        "viewportStructure": {
                            "type": "grid",
                            "properties": {
                                "rows": 1,
                                "columns": 1
                            },
                            "layoutTemplateName": "gridLayout"
                        },
                        "viewports": [
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "3.0"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "abstractPriorValue",
                                        "constraint": {
                                            "equals": {
                                                "value": 4
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                "name": "Stage C",
                "screens": [
                    {
                        "name": "Screen 1",
                        "viewportStructure": {
                            "type": "grid",
                            "properties": {
                                "rows": 2,
                                "columns": 1
                            },
                            "layoutTemplateName": "gridLayout"
                        },
                        "viewports": [
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Body 3.0"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [

                                ]
                            },
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Body 3.0"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "abstractPriorValue",
                                        "constraint": {
                                            "equals": {
                                                "value": 4
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "name": "Screen 2",
                        "viewportStructure": {
                            "type": "grid",
                            "properties": {
                                "rows": 2,
                                "columns": 1
                            },
                            "layoutTemplateName": "gridLayout"
                        },
                        "viewports": [
                            {
                                "viewportSettings": {
                                    "wlPreset": "Lung"
                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Lung 3.0"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [

                                ]
                            },
                            {
                                "viewportSettings": {
                                    "wlPreset": "Lung"
                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Lung 3.0"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "abstractPriorValue",
                                        "constraint": {
                                            "equals": {
                                                "value": 4
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ],
        "numberOfPriorsReferenced": 1
    });

    /**
     * Demo #2
     */

    HP.demoProtocols.push({
        "id": "demoProtocol2",
        "userId": "*",
        "name": "DFCI-CT-CHEST-COMPARE-2",
        "protocolMatchingRules": [
            {
                "weight": 2,
                "required": false,
                "attribute": "x00081030",
                "constraint": {
                    "contains": {
                        "value": "DFCI CT CHEST"
                    }
                }
            }
        ],
        "stages": [
            {
                "name": "Stage A",
                "screens": [
                    {
                        "viewportStructure": {
                            "type": "grid",
                            "properties": {
                                "rows": 1,
                                "columns": 2
                            },
                            "layoutTemplateName": "gridLayout"
                        },
                        "viewports": [
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "2.0"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [

                                ]
                            },
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "2.0"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "abstractPriorValue",
                                        "constraint": {
                                            "equals": {
                                                "value": 1
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                "name": "Stage B",
                "screens": [
                    {
                        "viewportStructure": {
                            "type": "grid",
                            "properties": {
                                "rows": 1,
                                "columns": 2
                            },
                            "layoutTemplateName": "gridLayout"
                        },
                        "viewports": [
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Body 3.0"
                                            }
                                        }
                                    },
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Body 5.0"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [

                                ]
                            },
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Body 3.0"
                                            }
                                        }
                                    },
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Body 5.0"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "abstractPriorValue",
                                        "constraint": {
                                            "equals": {
                                                "value": 1
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                "name": "Stage C",
                "screens": [
                    {
                        "viewportStructure": {
                            "type": "grid",
                            "properties": {
                                "rows": 2,
                                "columns": 2
                            },
                            "layoutTemplateName": "gridLayout"
                        },
                        "viewports": [
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Body 3.0"
                                            }
                                        }
                                    },
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Body 5.0"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [

                                ]
                            },
                            {
                                "viewportSettings": {
                                    "wlPreset": "Lung"
                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 2,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Lung 3.0"
                                            }
                                        }
                                    },
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Lung 5.0"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [

                                ]
                            },
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 2,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Body 3.0"
                                            }
                                        }
                                    },
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Body 5.0"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "abstractPriorValue",
                                        "constraint": {
                                            "equals": {
                                                "value": 1
                                            }
                                        }
                                    }
                                ]
                            },
                            {
                                "viewportSettings": {
                                    "wlPreset": "Lung"
                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 2,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Lung 3.0"
                                            }
                                        }
                                    },
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Lung 5.0"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "abstractPriorValue",
                                        "constraint": {
                                            "equals": {
                                                "value": 1
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ],
        "numberOfPriorsReferenced": 1
    });

    /**
     * Demo: screenCT
     */

    HP.demoProtocols.push({
        "id": "screenCT",
        "name": "DFCI-CT-CHEST-SCREEN",
        "protocolMatchingRules": [
            {
                "id": "7tmuq7KzDMCWFeapc",
                "weight": 2,
                "required": false,
                "attribute": "x00081030",
                "constraint": {
                    "contains": {
                        "value": "DFCI CT CHEST"
                    }
                }
            }
        ],
        "stages": [
            {
                "name": "Stage A",
                "screens": [
                    {
                        "viewportStructure": {
                            "type": "grid",
                            "properties": {
                                "rows": 1,
                                "columns": 1
                            },
                            "layoutTemplateName": "gridLayout"
                        },
                        "viewports": [
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "2.0"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [

                                ]
                            }
                        ]
                    }
                ]
            },
            {
                "name": "Stage B",
                "screens": [
                    {
                        "viewportStructure": {
                            "type": "grid",
                            "properties": {
                                "rows": 2,
                                "columns": 2
                            },
                            "layoutTemplateName": "gridLayout"
                        },
                        "viewports": [
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Body 5.0"
                                            }
                                        }
                                    },
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Body 3.0"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [

                                ]
                            },
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Lung 5.0"
                                            }
                                        }
                                    },
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Lung 3.0"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [

                                ]
                            },
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Body 4.0"
                                            }
                                        }
                                    },
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Coronal"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [

                                ]
                            },
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Body 4.0"
                                            }
                                        }
                                    },
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Sagittal"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [

                                ]
                            }
                        ]
                    }
                ]
            }
        ],
        "numberOfPriorsReferenced":0
    });

    /**
     * Demo: PETCTSCREEN
     */

    HP.demoProtocols.push({
        "id": "PETCTSCREEN",
        "name": "PETCT-SCREEN",
        "protocolMatchingRules": [
            {
                "weight": 5,
                "required": false,
                "attribute": "x00081030",
                "constraint": {
                    "contains": {
                        "value": "PETCT"
                    }
                }
            }
        ],
        "stages": [
            {
                "name": "Stage A",
                "screens": [
                    {
                        "viewportStructure": {
                            "type": "grid",
                            "properties": {
                                "rows": 1,
                                "columns": 2
                            },
                            "layoutTemplateName": "gridLayout"
                        },
                        "viewports": [
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Topogram"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [

                                ]
                            },
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Topogram"
                                            }
                                        }
                                    },
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x00200011",
                                        "constraint": {
                                            "numericality": {
                                                "greaterThanOrEqualTo": 2
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [

                                ]
                            }
                        ]
                    }
                ]
            },
            {
                "name": "Stage B",
                "screens": [
                    {
                        "viewportStructure": {
                            "type": "grid",
                            "properties": {
                                "rows": 1,
                                "columns": 2
                            },
                            "layoutTemplateName": "gridLayout"
                        },
                        "viewports": [
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "PET WB Corrected"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [

                                ]
                            },
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "CT WB"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [

                                ]
                            }
                        ]
                    }
                ]
            },
            {
                "name": "Stage C",
                "screens": [
                    {
                        "viewportStructure": {
                            "type": "grid",
                            "properties": {
                                "rows": 1,
                                "columns": 2
                            },
                            "layoutTemplateName": "gridLayout"
                        },
                        "viewports": [
                            {
                                "viewportSettings": {
                                    "invert": "YES"
                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "PET WB Uncorrected"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [

                                ]
                            },
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "CT Nk"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [

                                ]
                            }
                        ]
                    }
                ]
            }
        ],
        "numberOfPriorsReferenced":0
    });

    /**
     * Demo: PETCTCOMPARE
     */

    HP.demoProtocols.push({
        "id": "PETCTCOMPARE",
        "name": "PETCT-COMPARE",
        "protocolMatchingRules": [
            {
                "weight": 5,
                "required": false,
                "attribute": "x00081030",
                "constraint": {
                    "contains": {
                        "value": "PETCT"
                    }
                }
            }
        ],
        "stages": [
            {
                "name": "Stage A",
                "screens": [
                    {
                        "name": "oneByOne",
                        "viewportStructure": {
                            "type": "grid",
                            "properties": {
                                "rows": 1,
                                "columns": 2
                            },
                            "layoutTemplateName": "gridLayout"
                        },
                        "viewports": [
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Topogram"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [

                                ]
                            },
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Topogram"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "abstractPriorValue",
                                        "constraint": {
                                            "equals": {
                                                "value": 1
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                "name": "Stage B",
                "screens": [
                    {
                        "name": "oneByOne",
                        "viewportStructure": {
                            "type": "grid",
                            "properties": {
                                "rows": 1,
                                "columns": 2
                            },
                            "layoutTemplateName": "gridLayout"
                        },
                        "viewports": [
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Topogram"
                                            }
                                        }
                                    },
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x00200011",
                                        "constraint": {
                                            "numericality": {
                                                "greaterThanOrEqualTo": 2
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [

                                ]
                            },
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "Topogram"
                                            }
                                        }
                                    },
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x00200011",
                                        "constraint": {
                                            "numericality": {
                                                "greaterThanOrEqualTo": 2
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "abstractPriorValue",
                                        "constraint": {
                                            "equals": {
                                                "value": 1
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                "name": "Stage C",
                "screens": [
                    {
                        "name": "oneByOne",
                        "viewportStructure": {
                            "type": "grid",
                            "properties": {
                                "rows": 2,
                                "columns": 2
                            },
                            "layoutTemplateName": "gridLayout"
                        },
                        "viewports": [
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "PET WB Corrected"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [

                                ]
                            },
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "CT WB"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [

                                ]
                            },
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "PET WB Corrected"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "abstractPriorValue",
                                        "constraint": {
                                            "equals": {
                                                "value": 1
                                            }
                                        }
                                    }
                                ]
                            },
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "CT WB"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "abstractPriorValue",
                                        "constraint": {
                                            "equals": {
                                                "value": 1
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                "name": "Stage D",
                "screens": [
                    {
                        "name": "oneByOne",
                        "viewportStructure": {
                            "type": "grid",
                            "properties": {
                                "rows": 2,
                                "columns": 2
                            },
                            "layoutTemplateName": "gridLayout"
                        },
                        "viewports": [
                            {
                                "viewportSettings": {
                                    "invert": "YES"
                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "PET WB Uncorrected"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [

                                ]
                            },
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "CT Nk"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [

                                ]
                            },
                            {
                                "viewportSettings": {
                                    "invert": "YES"
                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "PET WB Uncorrected"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "abstractPriorValue",
                                        "constraint": {
                                            "equals": {
                                                "value": 1
                                            }
                                        }
                                    }
                                ]
                            },
                            {
                                "viewportSettings": {

                                },
                                "imageMatchingRules": [

                                ],
                                "seriesMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "x0008103e",
                                        "constraint": {
                                            "contains": {
                                                "value": "CT Nk"
                                            }
                                        }
                                    }
                                ],
                                "studyMatchingRules": [
                                    {
                                        "weight": 1,
                                        "required": false,
                                        "attribute": "abstractPriorValue",
                                        "constraint": {
                                            "equals": {
                                                "value": 1
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ],
        "numberOfPriorsReferenced": 1
    });

}

getDefaultProtocol();
getMRTwoByTwoTest();
getDemoProtocols();
