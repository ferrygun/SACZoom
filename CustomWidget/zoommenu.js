(function() {
    let _shadowRoot;
    let _id;

    let div;
    let widgetName;
    var Ar = [];

    let tmpl = document.createElement("template");
    tmpl.innerHTML = `
      <style>
      </style>      
    `;

    class ZoomMenu extends HTMLElement {

        constructor() {
            super();

            _shadowRoot = this.attachShadow({
                mode: "open"
            });
            _shadowRoot.appendChild(tmpl.content.cloneNode(true));

            _id = createGuid();
            
            this._export_settings = {};
            this._export_settings.title = "";
            this._export_settings.subtitle = "";
            this._export_settings.icon = "";
            this._export_settings.unit = "";
            this._export_settings.footer = "";
            this.addEventListener("click", event => {
                console.log('click');

            });
            this._firstConnection = 0;    
            this._firstLoadLib = 0;        
        }

        connectedCallback() {
            try {
                if (window.commonApp) {
                    let outlineContainer = commonApp.getShell().findElements(true, ele => ele.hasStyleClass && ele.hasStyleClass("sapAppBuildingOutline"))[0]; // sId: "__container0"

                    if (outlineContainer && outlineContainer.getReactProps) {
                        let parseReactState = state => {
                            let components = {};

                            let globalState = state.globalState;
                            let instances = globalState.instances;
                            let app = instances.app["[{\"app\":\"MAIN_APPLICATION\"}]"];
                            let names = app.names;

                            for (let key in names) {
                                let name = names[key];

                                let obj = JSON.parse(key).pop();
                                let type = Object.keys(obj)[0];
                                let id = obj[type];

                                components[id] = {
                                    type: type,
                                    name: name
                                };
                            }

                            for (let componentId in components) {
                                let component = components[componentId];
                            }

                            let metadata = JSON.stringify({
                                components: components,
                                vars: app.globalVars
                            });

                            if (metadata != this.metadata) {
                                this.metadata = metadata;

                                this.dispatchEvent(new CustomEvent("propertiesChanged", {
                                    detail: {
                                        properties: {
                                            metadata: metadata
                                        }
                                    }
                                }));
                            }
                        };

                        let subscribeReactStore = store => {
                            this._subscription = store.subscribe({
                                effect: state => {
                                    parseReactState(state);
                                    return {
                                        result: 1
                                    };
                                }
                            });
                        };

                        let props = outlineContainer.getReactProps();
                        if (props) {
                            subscribeReactStore(props.store);
                        } else {
                            let oldRenderReactComponent = outlineContainer.renderReactComponent;
                            outlineContainer.renderReactComponent = e => {
                                let props = outlineContainer.getReactProps();
                                subscribeReactStore(props.store);

                                oldRenderReactComponent.call(outlineContainer, e);
                            }
                        }
                    }
                }
            } catch (e) {}
        }

        disconnectedCallback() {
            if (this._subscription) { // react store subscription
                this._subscription();
                this._subscription = null;
            }
        }

        onCustomWidgetBeforeUpdate(changedProperties) {
            if ("designMode" in changedProperties) {
                this._designMode = changedProperties["designMode"];
            }
        }

        onCustomWidgetAfterUpdate(changedProperties) {
            var that = this;
            if (this._firstLoadLib === 0) {
                this._firstLoadLib = 1;
                let pubnubjs = "http://localhost/SAC/saczoommenu/pubnub.4.29.9.js";
                async function LoadLibs() {
                    try {
                        await loadScript(pubnubjs, _shadowRoot);
                    } catch (e) {
                        alert(e);
                    } finally {
                        letsGo(that, changedProperties);
                    }
                }
                LoadLibs();
            }
        }

        _renderExportButton() {
            let components = this.metadata ? JSON.parse(this.metadata)["components"] : {};
            console.log("_renderExportButton-components");
            console.log(components);
            console.log("end");
        }

        _firePropertiesChanged() {
            this.title = "FD";
            this.dispatchEvent(new CustomEvent("propertiesChanged", {
                detail: {
                    properties: {
                        title: this.title
                    }
                }
            }));
        }

        // SETTINGS
        get title() {
            return this._export_settings.title;
        }
        set title(value) {
        	console.log("setTitle:" + value);
            this._export_settings.title = value;
        }

        get subtitle() {
            return this._export_settings.subtitle;
        }
        set subtitle(value) {
            this._export_settings.subtitle = value;
        }

        get icon() {
            return this._export_settings.icon;
        }
        set icon(value) {
            this._export_settings.icon = value;
        }

        get unit() {
            return this._export_settings.unit;
        }
        set unit(value) {
            this._export_settings.unit = value;
        }

        get footer() {
            return this._export_settings.footer;
        }
        set footer(value) {
            this._export_settings.footer = value;
        }

        static get observedAttributes() {
            return [
                "title",
                "subtitle",
                "icon",
                "unit",
                "footer",
                "link"
            ];
        }

        attributeChangedCallback(name, oldValue, newValue) {
            if (oldValue != newValue) {
                this[name] = newValue;
            }
        }

    }
    customElements.define("com-fd-djaja-sap-sac-zoommenu", ZoomMenu);

    // UTILS
    function letsGo(that, changedProperties) {
        pubnub = new PubNub({
            publishKey: "PUBNUB_PUBLISH_KEY",
            subscribeKey: "PUBNUNB_SUBSCRIBE_KEY",
            uuid: "RANDOM_STRING"
        })

        pubnub.addListener({
            status: function(statusEvent) {
            },
            message: function(messageEvent) {
                loadthis(that, changedProperties, pubnub, messageEvent);
            },
            presence: function(presenceEvent) {
            }
        })
        console.log("Subscribing...");
        pubnub.subscribe({
            channels: ['sac_feed']
        });
        loadthis(that, changedProperties, pubnub, "");
    };

    function loadthis(that, changedProperties, pubnub, messageEvent) {
        var that_ = that;

        widgetName = changedProperties.widgetName;
        if(typeof widgetName === "undefined") {
            widgetName = that._export_settings.title.split("|")[0];
        }

        div = document.createElement('div');
        div.slot = "content_" + widgetName;

        if(that._firstConnection === 0) {
            console.log("--First Time --");

            let div0 = document.createElement('div');   
            div0.innerHTML = '<?xml version="1.0"?><script id="oView_' + widgetName + '" name="oView_' + widgetName + '" type="sapui5/xmlview"><mvc:View xmlns:mvc="sap.ui.core.mvc" xmlns:core="sap.ui.core" xmlns="sap.m" controllerName="myView.Template"><VBox class="sapUiMediumMargin"><Button text="Zoom" class="sapUiSmallMargin" press=".onButtonPress"></Button><FormattedText htmlText="{/HTML}"/></VBox></mvc:View></script>';
            _shadowRoot.appendChild(div0);  

            let div1 = document.createElement('div');  
            div1.innerHTML = '<?xml version="1.0"?><script id="myXMLFragment_' + widgetName + '" type="sapui5/fragment"><core:FragmentDefinition xmlns="sap.m" xmlns:core="sap.ui.core"><ActionSheet xmlns="sap.m" xmlns:core="sap.ui.core" id="actionSheet" core:require="{ MessageToast: \'sap/m/MessageToast\' }" title="Choose Your Action" showCancelButton="true" placement="Bottom"><Button text="Create Meeting" icon="sap-icon://accept" press=".onCreateMeeting"/><Button text="End Meeting" icon="sap-icon://decline" press=".onEndMeeting"/></ActionSheet></core:FragmentDefinition></script>';
            _shadowRoot.appendChild(div1);

            let div2 = document.createElement('div');            
            div2.innerHTML = '<div id="ui5_content_' + widgetName + '" name="ui5_content_' + widgetName + '"><slot name="content_' + widgetName + '"></slot></div>';
            _shadowRoot.appendChild(div2);   

            that_.appendChild(div);     

            var mapcanvas_divstr = _shadowRoot.getElementById('oView_' + widgetName);
            var mapcanvas_fragment_divstr = _shadowRoot.getElementById('myXMLFragment_' + widgetName);

            Ar.push({
                'id': widgetName,
                'div': mapcanvas_divstr,
                'divf': mapcanvas_fragment_divstr
            });
            console.log(Ar);
        }

        that_._renderExportButton();

        sap.ui.getCore().attachInit(function() {
            "use strict";

            //### Controller ###
            sap.ui.define([
                "jquery.sap.global",
                "sap/ui/core/mvc/Controller",
                "sap/ui/model/json/JSONModel",
                "sap/m/MessageToast",
                "sap/ui/core/library",
                "sap/ui/core/Core",
                'sap/ui/model/Filter',
                'sap/m/library',
                'sap/m/MessageBox',
                'sap/ui/unified/DateRange',
                'sap/ui/core/format/DateFormat',
                "sap/ui/model/BindingMode"
            ], function(jQuery, Controller, JSONModel, MessageToast, coreLibrary, Core, Filter, mobileLibrary, MessageBox, DateRange, DateFormat, BindingMode) {
                "use strict";

                return Controller.extend("myView.Template", {

                    onInit: function() {

                        console.log("-------oninit--------");

                        console.log(that._export_settings.title);
                        console.log("widgetName:" + that.widgetName);

                        if(that._firstConnection === 0) {
                            that._firstConnection = 1;
                            this._oModel = new JSONModel({
                                HTML: ""
                            });
                            this.getView().setModel(this._oModel);
                            sap.ui.getCore().setModel(this._oModel, "core");
                        } else {
                            console.log("----after---");
                            var oModel = sap.ui.getCore().getModel("core");
                            var feedback = messageEvent.message.feedback;

                            if(feedback.startsWith("https")) {
                                oModel.setProperty("/HTML", "<p><a href=" + messageEvent.message.feedback + " style=\"color:green; font-weight:600;\">link to Zoom meeting</a></p>" );
                            } else if(feedback === "terminated") {
                                MessageBox.information("Meeting Ended.");
                                oModel.setProperty("/HTML", "");
                            } else if (feedback === "cant_terminated") {
                                MessageBox.error("Can't end meeting. Please check if you have any meeting session active");
                            } else if (feedback === "cant_create") {
                                MessageBox.error("Can't create meeting. Please check if previous meeting session still active.");
                            } else {
                                oModel.setProperty("/HTML", "");
                            }
                        }
                    },

                    onButtonPress: function(oEvent) {
                        if (!this._oAssetDialog) {
                            var foundIndex_ = Ar.findIndex(x => x.id == widgetName);
                            var divfinal_ = Ar[foundIndex].divf;
                            this._oAssetDialog = sap.ui.xmlfragment({
                                fragmentContent : jQuery(divfinal_).html()
                            }, this);
                        }
                        console.log(this._oAssetDialog);
                        this._oAssetDialog.openBy(oEvent.getSource());
                    },

                    onCreateMeeting: async function(oEvent) {
                        console.log('create meeting');
                        createMeeting();
                    },

                    onEndMeeting: function(oEvent) {
                        console.log('end meeting');
                        endMeeting();
                    }
                });
            });

            console.log("widgetName Final:" + widgetName);
            var foundIndex = Ar.findIndex(x => x.id == widgetName);
            var divfinal = Ar[foundIndex].div;
            console.log(divfinal);

            //### THE APP: place the XMLView somewhere into DOM ###
            var oView = sap.ui.xmlview({
                viewContent: jQuery(divfinal).html(),
            });

            oView.placeAt(div);

            if (that_._designMode) {
                //oView.byId("dateId").setEnabled(false);
            }
        });
    }

    function createGuid() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
            let r = Math.random() * 16 | 0,
                v = c === "x" ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function createMeeting() {
        var publishPayload = {
            channel : "sac",
            message: {
                cmd: "create"
            }
        }
        pubnub.publish(publishPayload, function(status, response) {
            console.log(status, response);
        })
    }

    function endMeeting() {
        var publishPayload = {
            channel : "sac",
            message: {
                cmd: "end"
            }
        }
        pubnub.publish(publishPayload, function(status, response) {
            console.log(status, response);
        })
    }

    function loadScript(src, shadowRoot) {
        return new Promise(function(resolve, reject) {
            let script = document.createElement('script');
            script.src = src;

            script.onload = () => {
                console.log("Load: " + src);
                resolve(script);
            }
            script.onerror = () => reject(new Error(`Script load error for ${src}`));

            shadowRoot.appendChild(script)
        });
    }
})();
