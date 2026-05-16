o2.widget = o2.widget || {};
o2.widget.css = o2.widget.css || {};
o2.widget.Common = new Class({
	Implements: [Options, Events],
	options: {},
	initialize: function(options){
		this.setOptions(options);
	},
	_loadCss: function(reload){
        var key = encodeURIComponent(this.cssPath);
        if (!reload && o2.widget.css[key]){
            this.css = o2.widget.css[key];
        }else{
            this.cssPath = (this.cssPath.indexOf("?")!=-1) ? this.cssPath+"&v="+o2.version.v : this.cssPath+"?v="+o2.version.v;
            var r = new Request.JSON({
                url: o2.filterUrl(this.cssPath),
                secure: false,
                async: false,
                method: "get",
                noCache: false,
                onSuccess: function(responseJSON, responseText){
                    this.css = responseJSON;
                    o2.widget.css[key] = responseJSON;
                }.bind(this),
                onError: function(text, error){
                    alert(error + text);
                }
            });
            r.send();
        }
	},
	setLayoutStyle: function(node, classes, nodes){
		var styleNode = node || this.node;
		
		var elements = styleNode.getElements(".GOES");
		elements.each(function(item){
			var id = item.get("id");
			var styles = this.css[id];
			if (styles){
				item.setStyles(styles);
			}
			var idx = classes.indexOf(id);
			if (idx!=-1){
				this[nodes[idx]] = item;
			}
			item.removeProperty("id");
		}.bind(this));
	},
	setScrollBar: function(node, style, offset, callback){
		if (!style) style = "default";
		if (!offset){
			offset = {
				"V": {"x": 0, "y": 0},
				"H": {"x": 0, "y": 0}
			};
		};
		o2.require("o2.widget.ScrollBar", function(){
			var scrollBar = new o2.widget.ScrollBar(node, {
				"style": style,
				"offset": offset
			});
			if (callback) callback(scrollBar);
		});
		return false;
	}
});

o2.widget = o2.widget || {};
o2.widget.Dialog = o2.DL = new Class({
	Implements: [Options, Events],
    Extends: o2.widget.Common,
	options: {
		"style": "default",
		"title": "dialog",
		"width": "300",
		"height": "150",
		"contentWidth": null,
		"contentHeight": null,
		"top": "0",
		"left": "0",
		"fromTop": "0",
		"fromLeft": "0",
		"mark": true,

		"html": "",
		"text": "",
		"url": "",
		"content": null,
		"lp": null,

		"isMax": false,
		"isClose": false,
		"isResize": true,
		"isMove": true,
        "isTitle": true,

		"buttons": null,
		"buttonList": null,
        "maskNode" : null,

		"transition": null,
		"duration": 200,

		"debounceDelay": 1500,

        "container": null
	},
	initialize: function(options){

		this.setOptions(options);

		this.path = o2.session.path+"/widget/$Dialog/";
		this.cssPath = o2.session.path+"/widget/$Dialog/"+this.options.style+"/css.wcss";

		this._loadCss();

		this.reStyle();
//		this.css.to.height = this.options.height;
//		this.css.to.width = this.options.width;
//		this.css.to.top = this.options.top;
//		this.css.to.left = this.options.left;
//		this.css.to.top = this.options.top;
//		this.css.from.top = this.options.fromTop;
//		this.css.from.left = this.options.fromLeft;

		this.fireEvent("queryLoad");

		this.getContentUrl();
		var request = new Request.HTML({
			url: this.contentUrl,
			method: "GET",
			async: false,
			onSuccess: function(responseTree, responseElements, responseHTML, responseJavaScript){
				this.node = responseTree[0];
				this.getDialogNode();
				this.fireEvent("postLoad");
			}.bind(this),
			onFailure: function(xhr){
				alert(xhr);
			}
		});
		request.send();
	},
	getContentUrl: function(){
		this.contentUrl = o2.session.path+"/widget/$Dialog/"+this.options.style+"/dialog.html";
	},
	reStyle: function(options){
		if (options) this.setOptions(options);
		this.css.to.height = this.options.height+"px";
		this.css.to.width = this.options.width+"px";
		this.css.to.top = this.options.top+"px";
		this.css.to.left = this.options.left+"px";
		//this.css.to.top = this.options.top+"px";
		this.css.from.top = this.options.fromTop+"px";
		this.css.from.left = this.options.fromLeft+"px";

		if (this.node) this.node.set("styles", this.css.from);
	},

    getParentSelect: function(node){
        var select = "";
        var pnode = node.getParent();
        while (!select && pnode){
            select = pnode.getStyle("-webkit-user-select");
            var pnode = pnode.getParent();
        }
        return select;
    },
	getDialogNode: function(){
		this.node.set("styles", this.css.from);
		this.node.inject(this.options.container || $(document.body));
		this.node.addEvent("selectstart", function(e){
			var select = e.target.getStyle("-webkit-user-select");
            if (!select) select = this.getParentSelect(e.target);
			if (!select){
				select = "none";
			}else{
				select = select.toString().toLowerCase();
			}
			var tag = e.target.tagName.toString().toLowerCase();
			if (select!="text" && select!="auto" && ["input", "textarea"].indexOf(tag)==-1) e.preventDefault();

        }.bind(this));

		this.title = this.node.getElement(".MWF_dialod_title");
		this.titleCenter = this.node.getElement(".MWF_dialod_title_center");
        this.titleRefresh = this.node.getElement(".MWF_dialod_title_refresh");
		this.titleText = this.node.getElement(".MWF_dialod_title_text");
		this.titleAction = this.node.getElement(".MWF_dialod_title_action");
        this.under = this.node.getElement(".MWF_dialod_under");
		this.content = this.node.getElement(".MWF_dialod_content");
		this.bottom = this.node.getElement(".MWF_dialod_bottom");
		this.resizeNode = this.node.getElement(".MWF_dialod_bottom_resize");
		this.button = this.node.getElement(".MWF_dialod_button");

		if (!this.options.isTitle) {
            this.title.destroy();
            this.title = null;
            this.titleCenter = null;
            this.titleRefresh = null;
            this.titleText = null;
            this.titleAction = null;
        }

		if (this.title) this.title.setStyles(this.css.MWF_dialod_title);
        if (this.titleCenter) this.titleCenter.setStyles(this.css.MWF_dialod_title_center);
        if (this.titleRefresh) this.titleRefresh.setStyles(this.css.MWF_dialod_title_refresh);
        if (this.titleText) this.titleText.setStyles(this.css.MWF_dialod_title_text);
        if (this.titleAction) this.titleAction.setStyles(this.css.MWF_dialod_title_action);
        if (this.under) this.under.setStyles(this.css.MWF_dialod_under);
        if (this.content) this.content.setStyles(this.css.MWF_dialod_content);
        if (this.bottom) this.bottom.setStyles(this.css.MWF_dialod_bottom);
        if (this.resizeNode) this.resizeNode.setStyles(this.css.MWF_dialod_bottom_resize);
        if (this.button) this.button.setStyles(this.css.MWF_dialod_button);


		if (this.title) this.setTitleEvent();
        if (this.titleRefresh) this.setTitleRefreshNode();
	//	if (this.titleText) this.getTitle();
		if (this.content) this.getContent();
		if (this.titleAction) this.getAction();
		if (this.resizeNode) this.setResizeNode();
	//	if (this.button) this.getButton();

		if (this.content) this.setContentSize();
	},
    setTitleRefreshNode: function(){
        this.titleRefresh.setStyles(this.css.titleRefresh);
        this.titleRefresh.set("title", o2.LP.widget.refresh);
    },
	setTitleEvent: function(){
		var content;
		if (layout.app) content = layout.app.content;
		if (layout.desktop.currentApp) content = layout.desktop.currentApp.content;
		this.containerDrag = new Drag.Move(this.node, {
			"handle": this.title,
			"container": this.options.container || this.markNode || content,
			"snap": 5
		});

		// this.title.addEvent("mousedown", function(e){
        //     var content;
        //     if (layout.app) content = layout.app.content;
        //     if (layout.desktop.currentApp) content = layout.desktop.currentApp.content;
		// 	this.containerDrag = new Drag.Move(this.node, {
        //         "container": content
        //     });
		// 	this.containerDrag.start();
		// }.bind(this));
		// this.title.addEvent("mouseup", function(){
		// 	this.node.removeEvents("mousedown");
		// 	this.title.addEvent("mousedown", function(){
		// 		var content;
		// 		if (layout.app) content = layout.app.content;
		// 		if (layout.desktop.currentApp) content = layout.desktop.currentApp.content;
        //         this.containerDrag = new Drag.Move(this.node, {
        //             "container": content
        //         });
		// 		this.containerDrag.start();
		// 	}.bind(this));
		// }.bind(this));
	},
	setResizeNode: function(){
		//未实现................................
        if (!this.options.isResize){
            if (this.resizeNode) this.resizeNode.hide();
        }else{
            if (this.resizeNode){
                this.node.makeResizable({
                    "handle": this.resizeNode || this.bottom,
                    "limit": {x:[200, null], y:[150, null]},
                    "onDrag": function(){
                        var size = this.node.getComputedSize();
                        // this.css.to.width = size.totalWidth;
                        // this.css.to.height = size.totalHeight;
                        this.css.to.width = size.width;
                        this.css.to.height = size.height;

                        this.setContentSize(size.height, size.width);

                        this.fireEvent("resize");
                    }.bind(this),
                    "onComplete": function(){
                        this.fireEvent("resizeCompleted");
                    }.bind(this)
                });
			}
		}
	},
	getAction: function(){
		//未完成................................
		if (this.options.isClose){
			this.closeAction = new Element("div", {"styles": this.css.closeAction}).inject(this.titleAction);
            this.closeAction.addEvent("click", this.close.bind(this));
		}
	},
	getButton: function(){
		Object.each(this.options.buttons, function (fun, i){
			var button = new Element("input", {
				"type": "button",
				"value": i,
				"class": "mainColor_bg",
				"styles": this.css.button,
				"events": {
					"click": function (e){
						this.deounceButton(button);
						fun.call(this, this, e);
					}.bind(this)
				}
			}).inject(this.button);
		}.bind(this));
		// for (var i in this.options.buttons){
		// 	var button = new Element("input", {
		// 		"type": "button",
		// 		"value": i,
		// 		"class": "mainColor_bg",
		// 		"styles": this.css.button,
		// 		"events": {
		// 			"click": function (){
		// 				this.options.buttons[i].bind(this)
		// 			}.bind(this)
		// 		}
		// 	}).inject(this.button);
		// }

		if (this.options.buttonList){
			this.options.buttonList.each(function(bt){
				var styles = this.css.button;
				if( bt.type === "ok" && this.css.okButton )styles = this.css.okButton;
				if( bt.type === "cancel" && this.css.cancelButton )styles = this.css.cancelButton;
				if( bt.styles )styles = bt.styles;
				var button = new Element("input", {
					"type": "button",
					"value": bt.text,
					"title": bt.title,
					"class": (bt.type!=="cancel") ? "mainColor_bg" : "",
					"styles": styles,
					"events": {
						"click": function(e){
							this.deounceButton(button);
							bt.action.call(this, this, e);
						}.bind(this)
					}
				}).inject(this.button);
			}.bind(this));
		}
	},
	deounceButton: function (button){
		// var opacity = button.getStyle('opacity') || 1;
		// var op = parseInt(opacity, 10) / 2;
		button.disabled = true;
		//button.setStyle('opacity', op);
		setTimeout( function(){
			try{
				button.disabled = false;
				//button.setStyle('opacity', opacity);
			}catch(e){}
		}.bind(this), this.options.debounceDelay);
	},
	getContentSize: function(height, width){
        var nodeHeight, nodeWidth;
		if (!height){
			if (this.options.contentHeight){
                nodeHeight = height = this.options.contentHeight.toFloat();
			}else{
                height = this.options.height.toFloat();
			}
		}
        if (!width){
            if (this.options.contentWidth){
                nodeWidth = width = this.options.contentWidth.toFloat();
            }else{
                width = this.options.width.toFloat();
            }
        }

        var offsetHeight = 0;
        var offsetWidth = 0;
		if (this.title){
			var h1 = this.title.getSize().y;
			var ptop1 = this.title.getStyle("padding-top").toFloat();
			var pbottom1 = this.title.getStyle("padding-bottom").toFloat();
			var mtop1 = this.title.getStyle("margin-top").toFloat();
			var mbottom1 = this.title.getStyle("margin-bottom").toFloat();
            offsetHeight += h1 + ptop1 + pbottom1 + mtop1 + mbottom1;
		}
		if (this.bottom){
			var h2 = this.bottom.getSize().y;
			var ptop2 = this.bottom.getStyle("padding-top").toFloat();
			var pbottom2 = this.bottom.getStyle("padding-bottom").toFloat();
			var mtop2 = this.bottom.getStyle("margin-top").toFloat();
			var mbottom2 = this.bottom.getStyle("margin-bottom").toFloat();

            offsetHeight += h2 + ptop2 + pbottom2 + mtop2 + mbottom2;
		}
		if (this.button){
			var h3 = this.button.getSize().y;
			var ptop3 = this.button.getStyle("padding-top").toFloat();
			var pbottom3 = this.button.getStyle("padding-bottom").toFloat();
			var mtop3 = this.button.getStyle("margin-top").toFloat();
			var mbottom3 = this.button.getStyle("margin-bottom").toFloat();

            offsetHeight += h3 + ptop3 + pbottom3 + mtop3 + mbottom3;
		}

		var ptop4 = this.content.getStyle("padding-top").toFloat();
		var pbottom4 = this.content.getStyle("padding-bottom").toFloat();
		var mtop4 = this.content.getStyle("margin-top").toFloat();
		var mbottom4 = this.content.getStyle("margin-bottom").toFloat();
        offsetHeight += ptop4 + pbottom4 + mtop4 + mbottom4;

        var maxHeight = 0;
        if (nodeHeight){
            nodeHeight = nodeHeight + offsetHeight+2;
        }else {
            height = height - offsetHeight;
			if( height < 0 ){
				maxHeight = (this.options.container || $(document.body)).getSize().y;
				maxHeight = maxHeight - offsetHeight - 10;
			}
        }

        //if (this.content.getParent().getStyle("overflow-x")!="hidden" ) height = height-18;

		var pleft = this.content.getStyle("padding-left").toFloat();
		var pright = this.content.getStyle("padding-right").toFloat();
		var mleft = this.content.getStyle("margin-left").toFloat();
		var mright = this.content.getStyle("margin-right").toFloat();
        offsetWidth = pleft+pright+mleft+mright;
		//width = width-pleft-pright-mleft-mright;
        //if (this.content.getParent().getStyle("overflow-y")!="hidden" ) width = width-18;
        if (nodeWidth){
            nodeWidth = nodeWidth+offsetWidth;
        }else{
            width = width-offsetWidth;
		}


		if (nodeHeight) {
            this.options.height = nodeHeight;
            this.options.contentHeight = null;
            this.options.fromTop = this.options.fromTop.toFloat()-offsetHeight/2;
            this.options.top = this.options.top.toFloat()-offsetHeight/2;
            this.css.to.height = nodeHeight+"px";
            this.css.to.top = this.options.top+"px";
            this.css.from.top = this.options.fromTop+"px";
        }
        if (nodeWidth){
            this.options.width = nodeWidth;
            this.options.contentWidth = null;
            this.options.fromLeft = this.options.fromLeft.toFloat()-offsetWidth/2;
            this.options.left = this.options.left.toFloat()-offsetWidth/2;
            this.css.to.width = nodeWidth+"px";
            this.css.to.left = this.options.left+"px";
            this.css.from.left = this.options.fromLeft+"px";
        }

        if (!height || height<0){
            this.content.setStyles({"overflow": "hidden", "height": "auto", "width": ""+width+"px"});
            if( maxHeight )this.content.setStyles({"max-height": maxHeight+"px"});
            height = this.content.getSize().y;
            var h = height + h1 + ptop1 + pbottom1 + mtop1 + mbottom1;
            h = h + h2 + ptop2 + pbottom2 + mtop2 + mbottom2;
            h = h + h3 + ptop3 + pbottom3 + mtop3 + mbottom3;
            h = h + ptop4 + pbottom4 + mtop4 + mbottom4;
            this.css.to.height = h;
        }

//		var ptop5 = this.node.getStyle("padding-top").toFloat();
//		var pbottom5 = this.node.getStyle("padding-bottom").toFloat();
//		height = height - ptop5 - pbottom5;

		return {"height": height+"px", "width": width+"px"};
	},
	setContentSize: function(height, width){
		//this.content.setStyle("height", this.getContentSize(height));
		// if (!this.options.height && !height){
         //    this.content.setStyle("height", "auto");
         //    this.content.setStyle("overflow", "hidden");
         //    this.content.setStyle("width", "auto");
		// }else{
            this.content.setStyles(this.getContentSize(height, width));
            this.content.setStyle("width", "auto");
		//}
	},
	reCenter: function(){
		var size = this.node.getSize();
		var container = $(document.body);
		if (layout.desktop.currentApp){
			container = layout.desktop.currentApp.content;
		}else{
			if (this.options.container){
				if (this.options.container.getSize().y<$(document.body).getSize().y){
					container = this.options.container;
				}
			}
		}

		// if (this.options.container){
		// 	if (this.options.container.getSize().y<$(document.body).getSize().y){
		// 		container = this.options.container;
		// 	}
		// }

        var p = o2.getCenter(size, container, container);
        if (p.y<0) p.y = 0;
        this.options.top = p.y;
        this.options.left = p.x;
        this.css.to.top = this.options.top+"px";
        this.css.to.left = this.options.left+"px";
        this.node.setStyles({
			"top": this.css.to.top,
            "left": this.css.to.left
		});
	},

	getTitle: function(){
		this.titleText.set("text", this.options.title);
	},
	getContent: function(){
		this.content.setStyles(this.css.content);
		if (this.options.content){
			this.options.content.inject(this.content);
		}else if (this.options.url){
			this.content.set("load", {"method": "get", "async": false});
			$(this.content).loadHtml(this.options.url, {"bind": {"lp": this.options.lp}});
/*
			var request = new Request.HTML({
				url: this.options.url,
				method: "GET",
				onSuccess: function(responseTree, responseElements, responseHTML, responseJavaScript){
					alert(responseHTML);
					this.content.set("html", responseHTML);
				}.bind(this),
				onFailure: function(xhr){
					alert("回退出现错误："+xhr.status+" "+xhr.statusText);
					window.close();
				}
			});*/
		}else if (this.options.html){
			this.content.set("html", this.options.html);
		}else if (this.options.text){
			this.content.set("text", this.options.text);
		}
//		this.content.addEvent("selectstart", function(e){
//			e.preventDefault();
//		});
	},
	show: function(){
		if (this.options.mark) this._markShow();
		if (!this.morph){
			this.morph = new Fx.Morph(this.node, {duration: this.options.duration, "transition": this.options.transition});
		}
		if (this.fireEvent("queryShow")){
			this.node.setStyle("display", "block");

            // this.node.setStyles(t);
            // if (this.titleText) this.getTitle();
            // if (this.button) this.getButton();
            // //	this.content.setStyle("display", "block");
            // //this.fireEvent("postShow");

			var pn = this.node.getOffsetParent() || this.node.getParent();
			var p = pn.getPosition();

			var scrollParent = this.getScrollableParent(this.node);

			var h = this.css.to.height.toInt();
			var y = this.css.to.top.toInt();
			y = y+p.y;

			var windowHeight  = window.innerHeight.toInt();
			if( layout.mobile ){
				var toolbar = $(document.body).getElement(".o2_form_mobile_actions");
				if(toolbar)windowHeight = windowHeight - toolbar.getSize().y;
			}

			var ih = windowHeight + scrollParent.getScroll().y;
			if (h+y> ih){
				y = ih-p.y-h-20;
				if (y<0) y=0;
				this.css.to.top = ""+y+"px";
			}

			this.morph.start(this.css.to).chain(function(){
				if (this.titleText) this.getTitle();
				if (this.button) this.getButton();
			//	this.content.setStyle("display", "block");
				this.fireEvent("postShow");
			}.bind(this));
		}
	},
	getScrollableParent: function (ele) {
		if( !ele || ele === document.body )return document.body;
		if( this.isScrollable(ele) ){
			return ele;
		}else{
			return this.getScrollableParent(ele.parentNode);
		}
	},
	isScrollable: function (ele) {
		var hasScrollableContent = ele.scrollHeight > ele.clientHeight;

		var overflowYStyle = window.getComputedStyle(ele).overflowY;
		var isOverflowHidden = overflowYStyle.indexOf('hidden') !== -1;

		return hasScrollableContent && !isOverflowHidden;
	},
	hide: function() {
		if (!this.morph){
			this.morph = new Fx.Morph(this.node, {duration: this.options.duration, "transition": this.options.transition});
		}
		if (this.fireEvent("queryHide")){
			if (this.titleText) this.titleText.set("text", "");
			if (this.button) this.button.set("html", "");

			this.morph.start(this.css.from).chain(function(){
				this._markHide();
				this.node.setStyle("display", "none");
				this.fireEvent("postHide");
			}.bind(this));
		}
	},
	close: function(){
		if (!this.morph){
			this.morph = new Fx.Morph(this.node, {duration: this.options.duration, "transition": this.options.transition});
		}

		if (this.fireEvent("queryClose")){
			this.morph.start(this.css.from).chain(function(){
				this._markHide();
				this.node.destroy();
				this.node = null;
				this.fireEvent("postClose");
			}.bind(this));
		}
	},
	_markShow: function(){

		if (this.options.mark){
			if (!this.markNode){
				var size = o2.getMarkSize(this.options.maskNode);
				this.markNode = new Element("div", {
					styles: this.css.mark
				}).inject(this.options.container || $(document.body));
				this.markNode.set("styles", {
					"height": size.y,
					"width": size.x
				});
			}
			this.markNode.setStyle("display", "block");
		}
	},

	_markHide: function(){
		if (this.markNode){
			this.markNode.setStyle("display", "none");
			this.markNode.destroy();
			this.markNode = null;
		}
		if (this.markNode_up){
			this.markNode_up.setStyle("display", "none");
			this.markNode_up.destroy();
			this.markNode_up = null;
		}
	}
});

o2.widget = o2.widget || {};
o2.widget.UUID = new Class({
	initialize: function(){
		this.id = this.createUUID();
	},
	valueOf: function() {  
		return this.id;  
	},
	toString: function() {  
		return this.id;
	},
	createUUID: function(){
		//
		// Loose interpretation of the specification DCE 1.1: Remote Procedure Call
		// described at
		// http://www.opengroup.org/onlinepubs/009629399/apdxa.htm#tagtcjh_37
		// since JavaScript doesn't allow access to internal systems, the last 48
		// bits
		// of the node section is made up using a series of random numbers (6 octets
		// long).
		//  
		var dg = new Date(1582, 10, 15, 0, 0, 0, 0);
		var dc = new Date();
		var t = dc.getTime() - dg.getTime();
		var tl = this.getIntegerBits(t, 0, 31);
		var tm = this.getIntegerBits(t, 32, 47);
		var thv = this.getIntegerBits(t, 48, 59) + '1'; // version 1, security version is 2
		var csar = this.getIntegerBits(this.rand(4095), 0, 7);
		var csl = this.getIntegerBits(this.rand(4095), 0, 7);

		// since detection of anything about the machine/browser is far to buggy,
		// include some more random numbers here
		// if NIC or an IP can be obtained reliably, that should be put in
		// here instead.
		var n = this.getIntegerBits(this.rand(8191), 0, 7)
				+ this.getIntegerBits(this.rand(8191), 8, 15)
				+ this.getIntegerBits(this.rand(8191), 0, 7)
				+ this.getIntegerBits(this.rand(8191), 8, 15)
				+ this.getIntegerBits(this.rand(8191), 0, 15); // this last number is two octets long
		return tl + tm + thv + csar + csl + n;
	},
	createTrueUUID: function(){
		//
		// Loose interpretation of the specification DCE 1.1: Remote Procedure Call
		// described at
		// http://www.opengroup.org/onlinepubs/009629399/apdxa.htm#tagtcjh_37
		// since JavaScript doesn't allow access to internal systems, the last 48
		// bits
		// of the node section is made up using a series of random numbers (6 octets
		// long).
		//  
		var dg = new Date(1582, 10, 15, 0, 0, 0, 0);
		var dc = new Date();
		var t = dc.getTime() - dg.getTime();
		var tl = this.getIntegerBits(t, 0, 31);
		var tm = this.getIntegerBits(t, 32, 47);
		var thv = this.getIntegerBits(t, 48, 59) + '1'; // version 1, security version is 2
		var csar = this.getIntegerBits(this.rand(4095), 0, 7);
		var csl = this.getIntegerBits(this.rand(4095), 0, 7);

		// since detection of anything about the machine/browser is far to buggy,
		// include some more random numbers here
		// if NIC or an IP can be obtained reliably, that should be put in
		// here instead.
		var n = this.getIntegerBits(this.rand(8191), 0, 7)
				+ this.getIntegerBits(this.rand(8191), 8, 15)
				+ this.getIntegerBits(this.rand(8191), 0, 7)
				+ this.getIntegerBits(this.rand(8191), 8, 15)
				+ this.getIntegerBits(this.rand(8191), 0, 15); // this last number is two octets long
		return tl +"-"+ tm +"-"+ thv +"-"+ csar + csl +"-"+ n;
	},
	getIntegerBits: function(val, start, end){
		var base16 = this.returnBase(val, 16);
		var quadArray = new Array();
		var quadString = '';
		var i = 0;
		for (i = 0; i < base16.length; i++) {
			quadArray.push(base16.substring(i, i + 1));
		}
		for (i = Math.floor(start / 4); i <= Math.floor(end / 4); i++) {
			if (!quadArray[i] || quadArray[i] == '')
				quadString += '0';
			else
				quadString += quadArray[i];
		}
		return quadString;
	},
	returnBase: function(number, base) {
		return (number).toString(base).toUpperCase();
	},
	rand: function(max) {
		return Math.floor(Math.random() * (max + 1));
	}
	
});

o2.xDesktop = o2.xDesktop || {};
o2.xd = o2.xDesktop;
o2.xDesktop.requireApp = function(module, clazz, callback, async){
    o2.requireApp(module, clazz, callback, async)
};
o2.xApplication = o2.xApplication || {};

MWF.xDesktop.loadConfig = function(callback){
    o2.JSON.get("res/config/config.json", function(config) {
        if (config.proxyCenterEnable){
            if (o2.typeOf(config.center)==="array"){
                config.center.forEach(function(c){
                    c.port = window.location.port;
                });
            }else{
                config.port = window.location.port;
            }
        }
        layout.config = config;
        if (layout.config.app_protocol === "auto") {
            layout.config.app_protocol = window.location.protocol;
        }
        layout.config.systemName = layout.config.systemName || layout.config.footer;
        layout.config.systemTitle = layout.config.systemTitle || layout.config.title;
        if (callback) callback();
    });
};
MWF.xDesktop.getService = function(callback) {
    MWF.xDesktop.getServiceAddress(layout.config, function(service, center){
        layout.serviceAddressList = service;
        layout.centerServer = center;
        if (callback) callback();
    });
};
MWF.xDesktop.loadService = function(callback){
    MWF.xDesktop.loadConfig(function(){
        MWF.xDesktop.getService(callback);
    });
};

MWF.xDesktop.checkLogin = function(loginFun){
    layout.authentication = new MWF.xDesktop.Authentication({
        "onLogin": loginFun
    });
    layout.authentication.isAuthenticated(function(json){
        layout.session.user = json.data;
        if (loginFun) loginFun();
    }.bind(this), function(){
        layout.authentication.loadLogin(this.node);
    });
};

MWF.xDesktop.getDefaultLayout = function(callback){
    MWF.UD.getPublicData("defaultLayout", function(json) {
        if (json) layout.defaultLayout = json;
        if (callback) callback();
    }.bind(this));
},
MWF.xDesktop.getUserLayout = function(callback){
    MWF.UD.getPublicData("forceLayout", function(json) {
        var forceStatus = null;
        if (json) forceStatus = json;
        MWF.UD.getDataJson("layout", function(json) {
            if (json) {
                layout.userLayout = json;
                if( !layout.userLayout.flatStyle )layout.userLayout.flatStyle = layout.config.defaultSkin;
                if( !layout.userLayout.apps )layout.userLayout.apps = {};
                if (forceStatus) layout.userLayout.apps = Object.merge(layout.userLayout.apps, forceStatus.apps);
                if (callback) callback();
            }else{
                MWF.UD.getPublicData("defaultLayout", function(json) {
                    layout.userLayout = json || {};
                    // if( !layout.userLayout.flatStyle )
                        layout.userLayout.flatStyle = layout.config.defaultSkin || 'blue';
                    if( !layout.userLayout.apps )layout.userLayout.apps = {};
                    if (forceStatus) layout.userLayout.apps = Object.merge(layout.userLayout.apps, forceStatus.apps);
                    if (callback) callback();
                }.bind(this));
            }
        }.bind(this));
    }.bind(this));
},

MWF.xDesktop.notice = function(type, where, content, target, offset, option){
    if (!where) where = { "x": "right", "y": "top" };
    if (!type) type = "ok";
    var noticeTarget = target || layout.desktop.desktopNode || document.body;

    var off = offset;
    if (!off){
        off = {
            x: 10,
            y: where.y.toString().toLowerCase()=="bottom" ? 10 : 10
        };
    }

    var options = {
        type: type,
        position: where,
        move: false,
        target: noticeTarget,
        offset: off,
        content: content
    };
    if( option && typeOf(option) === "object" ){
        options = Object.merge( options, option );
    }
    new mBox.Notice(options);
};
MWF.xDesktop.loadPortal =  function(portalId, parameters, isLoginPage){
    layout.openApplication(null, "portal.Portal", {
        "portalId": portalId,
        "parameters": parameters,
        "isLoginPage": isLoginPage,
        "onAfterModulesLoad": function(){
            var layoutNode = $("layout");
            if (layoutNode) layoutNode.setStyles({
                "position": "absolute",
                "width": "100%",
                "z-index": 500,
                "top": "0px",
                "left": "0px"
            }).fade("out");
            var appContentNode = $("appContent");
            if (appContentNode) appContentNode.setStyles({
                "position": "absolute",
                "width": "100%",
                "top": "0px",
                "opacity": 0,
                "z-index": 500,
                "left": "0px",
                "height": "100%"
            }).fade("in");
        }
    }, null, true);
};
MWF.name = {
    "cns": function(names){
        if( typeOf(names) !== "array" )return [];
        var n = [];
        names.each(function(v){
            n.push(this.cn(v));
        }.bind(this));
        return n;
    },
    "cn": function(name){
        if (!name) return "";
        var idx = name.indexOf("@");
        return (idx!==-1) ? name.substring(0, idx) : name;
    },
    "ou": function(name){
        if (!name) return "";
        var idx = name.indexOf("@");
        var lastIdx = name.lastIndexOf("@");
        if (idx===-1){
            return name;
        }else if (lastIdx===idx){
            return "";
        }else{
            return name.substring(idx+1, lastIdx);
        }
    },
    "flag": function(name){
        if (!name) return "";
        var lastIdx = name.lastIndexOf("@");
        if (lastIdx===-1){
            return "";
        }else{
            return name.substring(lastIdx+1, name.length);
        }
    },
    "type": function(name){
        if (!name) return "";
        var lastIdx = name.lastIndexOf("@");
        if (lastIdx===-1){
            return "";
        }else{
            return name.substring(lastIdx+1, name.length);
        }
    }
};
MWF.xDesktop.confirm = function(type, e, title, text, width, height, ok, cancel, callback, mask, style){
    MWF.require("MWF.xDesktop.Dialog", function(){
        var container = layout.desktop.node || $(document.body);
        var size = container.getSize();
        var x = 0;
        var y = 0;

        if (typeOf(e)=="element"){
            var position = e.getPosition(container);
            x = position.x;
            y = position.y;
        }else{
            if (Browser.name=="firefox"){
                x = parseFloat(e.event.clientX);
                y = parseFloat(e.event.clientY);
            }else{
                x = parseFloat(e.x || e.event.x);
                y = parseFloat(e.y || e.event.y);
            }

            if (e.target){
                var position = e.target.getPosition(container);
                x = position.x;
                y = position.y;
            }
            //    }
        }

        if (x+parseFloat(width)>size.x){
            x = x-parseFloat(width);
        }
        if (x<0) x = 0;
        if (y+parseFloat(height)>size.y){
            y = y-parseFloat(height);
        }
        if (y<0) y = 0;

        var ctext = "";
        var chtml = "";
        if (typeOf(text).toLowerCase()=="object"){
            ctext = text.text;
            chtml = text.html;
        }else{
            ctext = text;
        }
        var dlg = new MWF.xDesktop.Dialog({
            "title": title,
            "style": style || "o2",
            "top": y,
            "left": x-20,
            "fromTop":y,
            "fromLeft": x-20,
            "width": width,
            "height": height,
            "text": ctext,
            "html": chtml,
            "container": MWF.xDesktop.node,
            "maskNode": mask,
            "buttonList": [
                {
                    "type": "ok",
                    "text": MWF.LP.process.button.ok,
                    "action": ok
                },
                {
                    "type": "cancel",
                    "text": MWF.LP.process.button.cancel,
                    "action": cancel
                }
            ]
        });

        switch (type.toLowerCase()){
            case "success":
                dlg.content.setStyle("background-image", "url(data:image/png;base64,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)");
                break;
            case "error":
                dlg.content.setStyle("background-image", "url(data:image/png;base64,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)");
                break;
            case "info":
                dlg.content.setStyle("background-image", "url(data:image/png;base64,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)");
                break;
            case "warn":
                dlg.content.setStyle("background-image", "url(data:image/png;base64,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)");
                break;
            default:
            //dlg.content.setStyle("background-image", "");
        }
        dlg.show();
        if (callback) callback(dlg);
    }.bind(this));
};
MWF.xDesktop.getImageSrc = function( id ){
    if (layout.config.app_protocol=="auto"){
        layout.config.app_protocol = window.location.protocol;
    }

    var addressObj = layout.serviceAddressList["x_file_assemble_control"];
    var defaultPort = layout.config.app_protocol==='https' ? "443" : "80";
    if (addressObj){
        var appPort = addressObj.port || window.location.port;
        var address = layout.config.app_protocol+"//"+(addressObj.host || window.location.hostname)+((!appPort || appPort.toString()===defaultPort) ? "" : ":"+appPort)+addressObj.context;
    }else{
        var host = layout.config.center.host || window.location.hostname;
        var port = layout.config.center.port || window.location.port;
        var address = layout.config.app_protocol+"//"+host+((!port || port.toString()===defaultPort) ? "" : ":"+port)+"/x_file_assemble_control";
    }
    var url = "/jaxrs/file/"+id+"/download/stream";
    return o2.filterUrl(address+url);
};
MWF.xDesktop.setImageSrc = function(){
    if( !event )return;
    var obj = event.srcElement ? event.srcElement : event.target;
    if( !obj )return;
    obj.onerror = null;
    var id = obj.get("data-id");
    if( id )obj.set("src" , MWF.xDesktop.getImageSrc(id) );
};
MWF.xDesktop.uploadImage = function( reference, referencetype, formData, file, success, failure ){
    this.action = new MWF.xDesktop.Actions.RestActions("/xDesktop/Actions/action.json", "x_file_assemble_control");
    this.action.invoke({
        "name": "uploadImage",
        "parameter": {"reference" : reference, "referencetype": referencetype},
        "data": formData,
        "file": file,
        "success": success,
        "failure": failure
    });
};
MWF.xDesktop.uploadImageByScale = function( reference, referencetype, scale, formData, file, success, failure ){
    this.action = new MWF.xDesktop.Actions.RestActions("/xDesktop/Actions/action.json", "x_file_assemble_control");
    this.action.invoke({
        "name": "uploadImageByScale",
        "parameter": {"reference" : reference, "referencetype": referencetype, "scale" : scale || 0},
        "data": formData,
        "file": file,
        "success": success,
        "failure": failure
    });
};
MWF.xDesktop.copyImage = function( reference, referencetype, attachmentId, scale, success, failure ){
    this.action = new MWF.xDesktop.Actions.RestActions("/xDesktop/Actions/action.json", "x_file_assemble_control");
    this.action.invoke({
        "name": "copyImage",
        "parameter": {"reference" : reference, "referencetype": referencetype, "attachmentId" : attachmentId, "scale":scale || 0 },
        "success": success,
        "failure": failure
    });
};
MWF.xDesktop.getPortalFileUr = function(id, app){
    var root = "x_portal_assemble_surface";
    var url = MWF.Actions.getHost(root)+"/"+root+MWF.Actions.get(root).action.actions.readFile.uri;
    url = url.replace("{flag}", id);
    url = url.replace("{applicationFlag}", app);
    return o2.filterUrl(url);
};
MWF.xDesktop.getProcessFileUr = function(id, app){
    var root = "x_processplatform_assemble_surface";
    var url = MWF.Actions.getHost(root)+"/"+root+MWF.Actions.get(root).action.actions.readFile.uri;
    url = url.replace("{flag}", id);
    url = url.replace("{applicationFlag}", app);
    return o2.filterUrl(url);
};
MWF.xDesktop.getCMSFileUr = function(id, app){
    var root = "x_cms_assemble_control";
    var url = MWF.Actions.getHost(root)+"/"+root+MWF.Actions.get(root).action.actions.readFile.uri;
    url = url.replace("{flag}", id);
    url = url.replace("{applicationFlag}", app);
    return o2.filterUrl(url);
};

MWF.xDesktop.getServiceAddress = function(config, callback){
    var error = function(){
        //MWF.xDesktop.notice("error", {"x": "right", "y": "top"}, "")
        var loadingNode = $("browser_loadding");
        var contentNode = $("appContent");
        ((loadingNode) ? loadingNode.getFirst() : contentNode).empty();
        var html= "<div style='width: 800px; color: #ffffff; margin: 30px auto'>" +
            "<div style='height: 40px;'>" +
            "   <div style='height: 40px; width: 40px; float: left; background: url(../x_desktop/img/error.png)'></div>" +
            "   <div style='margin-left: 50px; font-size: 20px; line-height: 40px;'>"+MWF.LP.desktop.notice.errorConnectCenter1+"</div>" +
            "</div><div style='margin-left: 0px;'>";
        if (typeOf(config.center)==="array"){
            config.center.each(function(center){
                var h = (center.host) ? center.host : window.location.hostname;
                var p = (center.port) ? ":"+center.port : "";
                var url = "http://"+h+p+"/x_program_center/jaxrs/echo";
                html+="<br><a style='margin-left: 50px; color: #e0e8d1; line-height: 30px;' href='"+url+"' target='_blank'>"+url+"</a>"
            });
        }else{
            var h = (config.center.host) ? config.center.host : window.location.hostname;
            var p = (config.center.port) ? ":"+config.center.port : "";
            var url = "http://"+h+p+"/x_program_center/jaxrs/echo";
            html+="<br><a style='margin-left: 50px; color: #e0e8d1; line-height: 30px;'href='"+url+"' target='_blank'>"+url+"</a>"
        }
        html+="</div><br><div style='margin-left: 50px; font-size: 20px'>"+MWF.LP.desktop.notice.errorConnectCenter2+"</div></div>";

        ((loadingNode) ? loadingNode.getFirst() : contentNode).set("html", html);
        if (!loadingNode && contentNode){
            contentNode.setStyle("background-color", "#666666");
        }
    };

    if (config.center){
        if (typeOf(config.center)==="object"){
            MWF.xDesktop.getServiceAddressConfigObject(config.center, callback, error);
        }else if (typeOf(config.center)==="array"){
            MWF.xDesktop.getServiceAddressConfigArray(config, callback, error);
        }
    }else{
        MWF.xDesktop.getServiceAddressConfigObject( {
            "host": window.location.hostname,
            "port": window.location.port || 80
        }, callback, error);
    }
};

MWF.xDesktop.getServiceAddressConfigArray = function(config, callback, error) {
    var requests = [];
    var centers = {};
    config.center.each(function(center){
        if (!centers[center.host+center.port]) {
            centers[center.host + center.port] = true;

            requests.push(
                MWF.xDesktop.getServiceAddressConfigObject(center, function(serviceAddressList, center){

                    requests.each(function(res){
                        if (res && res.res) if (res.res.isRunning()){res.res.cancel();}
                        if (res && res.actionWorker) res.actionWorker.terminate();
                    });
                    if (callback) callback(serviceAddressList, center);
                }.bind(this), function(){

                    if (requests.length){
                        for (var i=0; i<requests.length; i++){
                            if (requests[i].res) if (requests[i].res.isRunning()) return "";
                            if (requests[i].actionWorker && requests[i].actionWorker.terminate) return "";
                        }
                    }
                    if (error) error();
                }.bind(this))
            );
        }
    }.bind(this));
};
MWF.xDesktop.getServiceAddressConfigObject = function(center, callback, error){
    var centerConfig = center;
    if (!centerConfig) centerConfig = layout.config.center;
    var host = centerConfig.host || window.location.hostname;
    var port = centerConfig.port;
    var uri = "";

    if (layout.config.app_protocol=="auto"){
        layout.config.app_protocol = window.location.protocol;
    }

    if (!port || port=="80"){
        uri = layout.config.app_protocol+"//"+host+"/x_program_center/jaxrs/distribute/assemble/source/{source}";
    }else{
        uri = layout.config.app_protocol+"//"+host+":"+port+"/x_program_center/jaxrs/distribute/assemble/source/{source}";
    }

    var currenthost = (layout.config.applicationServer && layout.config.applicationServer.host) ? layout.config.applicationServer.host : window.location.hostname;
    //var currenthost = window.location.hostname;
    uri = uri.replace(/{source}/g, currenthost);
    //var uri = "http://"+layout.config.center+"/x_program_center/jaxrs/distribute/assemble";

    try{
        return MWF.restful("get", uri, null, {
            "onSuccess": function(json){
                //this.serviceAddressList = json.data;
                //this.centerServer = center;
                var serviceAddressList = json.data;
                if (layout.config.proxyApplicationEnable || !layout.config.center){
                    Object.keys(serviceAddressList).forEach(function(k){
                        if (k!=="x_message_assemble_communicate" || !layout.config.center) serviceAddressList[k].port = window.location.port;
                    })
                }
                if (callback) callback(serviceAddressList, center);
            }.bind(this),
            "onRequestFailure": function(xhr){
                if (error) error(xhr);
            }.bind(this),
            "onError": function(xhr){
                if (error) error(xhr);
            }.bind(this)
        });
    }catch(e){
        if (error) error();
        return null;
    }
};
MWF.xDesktop.$globalEvents = {};
MWF.xDesktop.addEvent = function(appName, type, fn){
    const name = appName || '$all';
    if (!MWF.xDesktop.$globalEvents[name]) MWF.xDesktop.$globalEvents[name] = {};
    if (!MWF.xDesktop.$globalEvents[name][type]) MWF.xDesktop.$globalEvents[name][type] = [];
    MWF.xDesktop.$globalEvents[name][type].push(fn);
};

MWF.xDesktop.addEvents = function(appName, o){
    const name = appName || '$all';
    if (!MWF.xDesktop.$globalEvents[name]) MWF.xDesktop.$globalEvents[name] = {};
    Object.each(o, function(fn, type){
        MWF.xDesktop.addEvent(name, type, fn);
    }.bind(this));
};

MWF.xDesktop.removeEvent = function(appName, type, fn){
    const name = appName || '$all';
    if (!MWF.xDesktop.$globalEvents[name]) return true;
    if (!MWF.xDesktop.$globalEvents[name][type]) return true;
    MWF.xDesktop.$globalEvents[name][type].erase(fn);
};
MWF.xDesktop.removeEvents = function(appName, type){
    const name = appName || '$all';
    if (!MWF.xDesktop.$globalEvents[name]) return true;
    if (!MWF.xDesktop.$globalEvents[name][type]) return true;
    MWF.xDesktop.$globalEvents[name][type] = [];
};

MWF.org = {
    parseOrgData: function(data, flat, simple){
        if (data.distinguishedName){
            var flag = data.distinguishedName.substr(data.distinguishedName.length-2, 2);
            switch (flag.toLowerCase()){
                case "@i":
                    return this.parseIdentityData(data, flat, simple);
                    break;
                case "@p":
                    return this.parsePersonData(data, simple);
                    break;
                case "@u":
                    return this.parseUnitData(data, simple);
                    break;
                case "@g":
                    return this.parseGroupData(data, simple);
                    break;
                case "@r":
                    return this.parseRoleData(data, simple);
                    break;
                case "@a":
                    return this.parseAttributeData(data, simple);
                    break;
                default:
                    return data;
            }
        }else{
            return data;
        }
    },
    parseIdentityData: function(data, flat, simple){
        if( simple ){
            var ndata = {
                "id": data.id,
                "name": data.name,
                "distinguishedName": data.distinguishedName,
                "unitLevelName" : data.unitLevelName,
                "person": data.person,
                "unit": data.unit,
                "unitName": data.unitName,
            };
            if( data.ignoreEmpower )ndata.ignoreEmpower = true;
            if( data.ignoredEmpower )ndata.ignoredEmpower = true;
            return ndata;
        }
        var rData = {
            "id": data.id,
            "name": data.name,
            "unique": data.unique,
            "distinguishedName": data.distinguishedName,
            // "dn": data.distinguishedName,
            "person": data.person,
            "unit": data.unit,
            "unitName": data.unitName,
            // "unitLevel": data.unitLevel,
            "unitLevelName": data.unitLevelName
        };

        if( data.personName )rData.personName = data.personName;
        if( data.personEmployee )rData.personEmployee = data.personEmployee;
        if( data.personUnique )rData.personUnique = data.personUnique;
        if( data.personDn )rData.personDn = data.personDn;

        if( data.ignoreEmpower )rData.ignoreEmpower = true;
        if( data.ignoredEmpower )rData.ignoredEmpower = true;

        if( !flat || !data.personDn || !data.personEmployee || !data.personUnique ){
            var woPerson = data.woPerson;
            if (!data.woPerson){
                //MWF.require("MWF.xDesktop.Actions.RestActions", null, false);
                //this.action = new MWF.xDesktop.Actions.RestActions("", "x_organization_assemble_control");
                //var uri = "/jaxrs/person/{flag}";
                //uri = uri.replace("{flag}", data.person);

                //this.action.invoke({"uri": uri, "success": function(json){
                //    woPerson = json.data;
                //}.bind(this), "async":false});
                MWF.Actions.get("x_organization_assemble_control").getPerson(data.person, function(json){
                    woPerson = json.data
                }, null, false);
            }
            rData.personName = woPerson.name;
            rData.personEmployee = woPerson.employee;
            rData.personUnique = woPerson.unique;
            rData.personDn = woPerson.distinguishedName;

            if (!flat){
                rData.woPerson = {
                    "id": woPerson.id,
                    "genderType": woPerson.genderType,
                    "name": woPerson.name,
                    "employee": woPerson.employee,
                    "unique": woPerson.unique,
                    "distinguishedName": woPerson.distinguishedName,
                    "dn": woPerson.distinguishedName,
                    "mail": woPerson.mail,
                    "weixin": woPerson.weixin,
                    "qq": woPerson.qq,
                    "mobile": woPerson.mobile,
                    "officePhone": woPerson.officePhone
                };
            }
        }
        return rData;
    },
    parsePersonData: function(data, simple){
        if( simple ){
            return {
                "id": data.id,
                "name": data.name,
                "employee": data.employee,
                "distinguishedName": data.distinguishedName,
            }
        }else{
            return {
                "id": data.id,
                "genderType": data.genderType,
                "name": data.name,
                "employee": data.employee,
                "unique": data.unique,
                "distinguishedName": data.distinguishedName,
                "dn": data.distinguishedName,
                "mail": data.mail,
                "weixin": data.weixin,
                "qq": data.qq,
                "mobile": data.mobile,
                "officePhone": data.officePhone
            }
        }
    },
    parseUnitData: function(data, simple){
        if( simple ){
            return {
                "id": data.id,
                "name": data.name,
                "distinguishedName": data.distinguishedName,
                "levelName": data.levelName
            }
        }else{
            return {
                "id": data.id,
                "name": data.name,
                "unique": data.unique,
                "distinguishedName": data.distinguishedName,
                "dn": data.distinguishedName,
                "typeList":data.typeList,
                "shortName": data.shortName,
                "level": data.level,
                "levelName": data.levelName
            }
        }
    },
    parseGroupData: function(data, simple){
        if( simple ){
            return {
                "id": data.id,
                "name": data.name,
                "distinguishedName": data.distinguishedName
            }
        }else{
            return {
                "id": data.id,
                "name": data.name,
                "unique": data.unique,
                "distinguishedName": data.distinguishedName,
                "dn": data.distinguishedName
            }
        }
    },
    parseRoleData: function(data, simple){
        if( simple ){
            return {
                "id": data.id,
                "name": data.name,
                "distinguishedName": data.distinguishedName
            }
        }else{
            return {
                "id": data.id,
                "name": data.name,
                "unique": data.unique,
                "distinguishedName": data.distinguishedName,
                "dn": data.distinguishedName
            }
        }
    },
    parseAttributeData: function(data, simple){
        if(simple){
            return {
                "id": data.id,
                "name": data.name,
                "distinguishedName": data.distinguishedName,
                "person": data.person,
                "attributeList": Array.clone(data.attributeList)
            }
        }else{
            return {
                "id": data.id,
                "description": data.description,
                "name": data.name,
                "unique": data.unique,
                "distinguishedName": data.distinguishedName,
                "dn": data.distinguishedName,
                "person": data.person,
                "attributeList": Array.clone(data.attributeList)
            }
        }
    }
};
//var lp = o2.session.path + "/lp/" + o2.language + ".js";
// var lp = "../x_desktop/js/base_lp_" + o2.language +((o2.session.isDebugger) ? "" : ".min")+ ".js";
// if (!o2.LP){
//     new Request({
//         "url": lp,
//         "method": "get"
//     }).send();
// }

o2.openWindow = function(url){
    var a = new Element("a", {
        "target": "_blank",
        "href": url
    });
    a.click();
    a.destroy();
}


function getStartableProcess(app) {
    const client = layout.mobile ? 'mobile' : 'client';
    return o2.Actions.load('x_processplatform_assemble_surface').ApplicationAction.listWithPersonAndTerminal(client).then((json) => {
        if (app) {
            const apps = Array.isArray(app) ? app : [app];
            json.data = json.data.filter((a) => {
                return (apps.includes(a.name) || apps.includes(a.id) || apps.includes(a.alias))
            });
        }
        return json;
    });
}

function getNaviData(data) {
    const menu = [];
    let n = 0;
    data.forEach((app) => {
        const categoryName = app.applicationCategory || '未分类';
        let category = menu.find((m) => {
            return m.text === categoryName
        });
        if (!category) {
            category = {
                type: 'category',
                name: categoryName,
                title: categoryName,
                text: categoryName,
                count: 0,
                expanded: true,
                selectable: 'yes',
                children: []
            }
            menu.push(category);
        }
        category.count += app.processList.length;


        category.children.push({
            "name": app.id,
            "img": app.icon ? `data:image/png;base64,${app.icon}` : `../x_component_process_ApplicationExplorer/$Main/default/icon/application.png`,
            "title": app.name,
            "text": app.name,
            "count": app.processList.length
        });
        n += app.processList.length;
    });
    menu.unshift({
        "img": `../x_component_process_ApplicationExplorer/$Main/default/icon/application.png`,
        "title": '全部',
        "text": '全部',
        "selected": true,
        "count": n
    });

    return menu;
}

function setNaviAction(navi, processArea, processData, input, dlg) {
    navi.addEventListener('active', (e) => {
        if (input.value) {
            input.value = '';
            createStartableProcess(processData, processArea, dlg);
        }

        const data = e.detail.data;

        if (!data.name) {
            const nodes = processArea.getElements('.index-starter-process-application');
            nodes.setStyle('display', 'block');
        } else {
            const nodes = processArea.getElements('.index-starter-process-application');
            nodes.setStyle('display', 'none');

            if (data.type === 'category') {
                const nodes = processArea.getElements(`.index-starter-process-application[data-category-name="${data.name}"]`);
                nodes.setStyle('display', 'block');
            } else {
                const nodes = processArea.getElements(`.index-starter-process-application[data-application-name="${data.name}"]`);
                nodes.setStyle('display', 'block');
            }
        }
    })
}

function createStartableProcess(data, node, options, dlg) {
    node.empty();
    data.forEach((app) => {
        let processHtml = '';

        app.processList.forEach((process) => {
            processHtml += `
                <dl data-process-id="${process.id}" data-application-id="${process.application}" data-title="${process.name}">
                    <dt><div>${process.name}</div><div class="ooicon-arrow_forward"></div></dt>
                    <dd>${process.description || '此流程没有描述'}</dd>
                </dl>
            `
        });

        const html = `
            <div class="index-starter-process-application" data-application-name="${app.id}" data-category-name="${app.applicationCategory || '未分类'}">
                <div class="index-starter-process-application-title">${app.name}</div>
                <div class="index-starter-process-area">
                    ${processHtml}
                </div>
            </div>
        `
        node.insertAdjacentHTML('beforeend', html);
        const currentNode = node.getLast();
        const dls = currentNode.getElements('dl');
        dls.forEach((dl) => {
            $OOUI.tooltip(dl.dataset.title, dl);
            dl.addEvent('click', (e) => {
                dlg.close();
                const id = e.event.currentTarget.dataset.processId;
                const app = e.event.currentTarget.dataset.applicationId;
                if (id) {
                    let { data, identity, callback, target, latest, afterCreated, skipDraftCheck } = options;
                    o2.api.page.startProcess(app, id, data, identity, callback, target, latest, afterCreated, skipDraftCheck)
                }
            });
        });
    });
}
function searchProcess(key, processData, processArea, options, dlg, app) {
    if (key) {
        const keyWord = key.toString().toLowerCase();
        const searchData = [{
            name: '“' + key + '” 的搜索结果',
            processList: []
        }];
        processData.forEach((app) => {
            app.processList.forEach((process) => {
                if (process.name.toLowerCase().includes(keyWord)) {
                    searchData[0].processList.push(process);
                }
            });
        });
        createStartableProcess(searchData, processArea, options, dlg);
    }else{
        getStartableProcess(app).then((json) => {
            createStartableProcess(json.data, processArea, options, dlg);
        });
    }
}

layout.startProcess = function (app, process, data, identity, callback, target, latest, afterCreated, skipDraftCheck) {
    const options = { app, process, data, identity, callback, target, latest, afterCreated, skipDraftCheck };

    if (app && process) {
        o2.api.page.startProcess(app, process, data, identity, callback, target, latest, afterCreated, skipDraftCheck);
    } else {
        const content = new Element('div.index-process-starter');
        const html = `
        <div class="index-starter-navi">
            <oo-nav searchable="false"></oo-nav>
        </div>
        <div class="index-starter-area">
            <div class="index-starter-search">
                <oo-input type="search" left-icon="search" style="width:100%" placeholder="输入关键字，搜索可启动流程"></oo-input>
            </div>
            <div class="index-starter-content"></div>
            <div class="index-starter-buttons">
                <oo-button type="cancel" text="取消"></oo-button>
            </div>
        </div>
    `;
        content.innerHTML = html;

        const p = $OOUI.dialog('', content, 
            o2.isMediaMobile() ? null : (layout.desktop.currentApp || layout.desktop.app).node, 
            {
                buttons: '',
                skin: 'body-padding: 1em 0',
                width: o2.isMediaMobile() ? '100%' : '72em',
                height: o2.isMediaMobile() ? '100%' : '46em',
                canResize: true,
                canClose: false,
                closeOnModalClick: true
            }
        );

        const cancelButton = content.querySelector('.index-starter-buttons>oo-button')
        cancelButton.addEvent('click', ()=>{
             p.dlg.close();
        });

        getStartableProcess(app).then((json) => {
            const processData = json.data;

            const menu = getNaviData(json.data);
            const navi = content.querySelector('oo-nav');
            navi.setMenu(menu);

            const processArea = content.querySelector('.index-starter-content');
            createStartableProcess(json.data, processArea, options, p.dlg);

            //搜索
            const input = content.querySelector('oo-input');
            input.addEvent('keydown', (e) => {
                if (e.key === 'enter') {
                    searchProcess(e.target.value, processData, processArea, options, p.dlg, app);
                }
            })

            setNaviAction(navi, processArea, processData, input, p.dlg);
        });
    }
}
MWF.xDesktop.Actions = MWF.xDesktop.Actions || {};
MWF.xDesktop.Actions.RestActions = new Class({
    Implements: [Events],
    initialize: function(actionPath, serviceName, root){
        this.actionPath = actionPath;
        this.serviceName = serviceName;
        this.root = root;
    },

    listApplicationAddress: function(success, failure){
        var url = this.actions.listAddress;
        url = this.actions.slotHost+url;
        var callback = new MWF.xApplication.Common.Actions.RestActions.Callback(success, failure);
        MWF.getJSON(url, callback);
    },
    getAddress: function(success, failure){
//		var name = "x_processplatform_core_designer";
//		var url = this.actions.getAddress.replace(/{id}/g, name);
//		url = this.actions.slotHost+url;
//		var callback = new MWF.process.RestActions.Callback(success, failure, function(data){
//			this.designAddress = data.data.url;
//		}.bind(this));

//		MWF.getJSON(url, callback);

        //this.address = "http://xa02.zoneland.net:8080/"+this.serviceName;
        var addressObj = layout.serviceAddressList[this.serviceName];
        var defaultPort = layout.config.app_protocol==='https' ? "443" : "80";
        if (addressObj){
            //var mapping = layout.getAppUrlMapping(layout.config.app_protocol+"//"+addressObj.host+(addressObj.port==80 ? "" : ":"+addressObj.port)+addressObj.context);
            var appPort = addressObj.port || window.location.port;
            this.address = layout.config.app_protocol+"//"+(addressObj.host || window.location.hostname)+((!appPort || appPort.toString()===defaultPort) ? "" : ":"+appPort)+addressObj.context;
        }else{
            var host = layout.desktop.centerServer.host || window.location.hostname;
            var port = layout.desktop.centerServer.port || window.location.port;

            //var mapping = layout.getCenterUrlMapping(layout.config.app_protocol+"//"+host+(port=="80" ? "" : ":"+port)+"/x_program_center");
            this.address = layout.config.app_protocol+"//"+host+((!port || port.toString()===defaultPort) ? "" : ":"+port)+"/"+this.serviceName;
        }

        //this.address = "http://hbxa01.bf.ctc.com/"+this.serviceName;
        //this.designAddress = "http://localhost:9080/x_processplatform_front_designer";
        if (success) success.apply();
        return this.address;
    },
    getActions: function(callback){

        if (!this.actions){
            var url = (this.root) ? "/"+this.root+this.actionPath : MWF.defaultPath+this.actionPath;
            MWF.getJSON(url, function(json){
                this.actions = json;
                if (callback) callback();
            }.bind(this), false, false, false);
        }else{
            if (callback) callback();
        }
    },
    invokeUri: function(option){
        if (!this.address) this.getAddress();
        var uri = this.address+option.uri;
        var async = (option.async===false) ? false : true;
        var method = option.method || "GET";
        var callback = new MWF.xDesktop.Actions.RestActions.Callback(option.success, option.failure);

        var data = (option.data) ? JSON.encode(option.data) : "";
        var credentials = true;
        if (option.withCredentials===false){
            credentials = false;
        }
        MWF.restful(method, uri, data, callback, async, credentials);
    },
    invoke: function(option){
        if (window.importScripts && window.isCompletionEnvironment) return null;
        if (!this.address) this.getAddress();
        var res = null;
        this.getActions(function(){
            //name, parameter, data, async, success, failure, withCredentials, urlEncode
            var action = this.actions[option.name];
            var method = action.method || "GET";
            var uri = action.uri;
            var progress = action.progress;

            if (option.parameter){
                Object.each(option.parameter, function(value, key){
                    var reg = new RegExp("{"+key+"}", "g");
                    if (option.urlEncode===false){
                        uri = uri.replace(reg, value);
                    }else{
                        uri = uri.replace(reg, encodeURI(value));
                    }
                });
            }
            uri = this.address+uri;

            //putToPost, deleteToGet
            if (layout.config.mock && layout.config.mock[this.serviceName]){
                var mock = layout.config.mock[this.serviceName][method.toLowerCase()];
                if (mock){
                    method = mock.to || method;
                    var append = mock.append;
                    uri = uri+((uri.substr(uri.length-1, 1)=="/") ? append : "/"+append);
                }
            }

            var async = (option.async===false) ? false : true;

            // if (!option.success) option.success = function(v){return v;}.ag();
            // if (option.success && !option.success.isAG) option.success = option.success.ag();
            //
            // if (option.failure && option.failure.failure) option.failure = option.failure.failure;
            // if (option.failure) {
            //     option.success.catch(option.failure);
            //     option.failure.owner = option.success;
            // }
            // if (!option.failure && option.success && option.success.failure){
            //     option.failure = option.success.failure;
            //     option.failure.owner = option.success;
            // }

            // if (option.failure && option.failure.failure) option.failure = option.failure.failure;
            // if (!option.failure && option.success && option.success.failure){
            //     option.failure = option.success.failure;
            //     option.failure.owner = option.success;
            // }
            // if (!option.success){
            //     option.success = function(v){return v;}.ag();
            //     if (option.failure) {
            //         option.success.catch(option.failure);
            //         option.failure.owner = option.success;
            //     }
            // }

            var callback = new MWF.xDesktop.Actions.RestActions.Callback(option.success, option.failure);
            if (action.enctype && (action.enctype.toLowerCase()=="formdata")){
                res = this.invokeFormData(method, uri, option.data, option.file, callback, async, progress);
            }else{
                //var data = (option.data) ? JSON.encode(option.data) : "";
                var data = JSON.encode(option.data);
                var credentials = true;
                if (option.withCredentials===false){
                    credentials = false;
                }
                res = MWF.restful(method, uri, data, callback, async, credentials, option.cache);
            }
        }.bind(this));
        return res;
    },
    formDataUpdateProgress: function(){

    },

    invokeFormDataWithProgress: function(xhr, method, uri, data, file, callback, async, progress){
        var messageItem = null;
        var currentDate = new Date();

        xhr.upload.addEventListener("progress", function(e){this.updateProgress(e, xhr, messageItem, currentDate);}.bind(this), false);
        xhr.upload.addEventListener("load", function(e){
            if(file){
                this.transferComplete(e, xhr, messageItem, currentDate, file);
            }
        }.bind(this), false);
        xhr.upload.addEventListener("loadstart", function(e){this.transferStart(e, xhr, messageItem);}.bind(this), false);
        xhr.upload.addEventListener("error", function(e){this.transferFailed(e, xhr, messageItem);}.bind(this), false);
        xhr.upload.addEventListener("abort", function(e){this.transferCanceled(e, xhr, messageItem);}.bind(this), false);
        xhr.upload.addEventListener("timeout", function(e){this.transferCanceled(e, xhr, messageItem);}.bind(this), false);

        xhr.addEventListener("readystatechange", function(e){this.xhrStateChange(e, xhr, messageItem, callback);}.bind(this), false);

        xhr.open(method, uri, async!==false);
        xhr.withCredentials = true;

        var token = (layout.config && layout.config.sessionStorageEnable) ? sessionStorage.getItem("o2LayoutSessionToken") : "";
        if (!token) {
            token = (layout.session && layout.session.user) ? (layout.session.token || layout.session.user.token) : "";
        }
        if (token) {
            xhr.setRequestHeader("Authorization", token);
        }

        if (file && File.prototype.isPrototypeOf(file)) messageItem = this.addFormDataMessage(file, false, xhr, progress);
        xhr.send(data);
    },
    setMessageText: function(messageItem, text){
        if (messageItem && messageItem.message){
            var progressNode = messageItem.contentNode.getFirst("div").getFirst("div");
            var progressPercentNode = progressNode.getFirst("div");
            var progressInforNode = messageItem.contentNode.getFirst("div").getLast("div");
            progressInforNode.set("text", text);
            messageItem.dateNode.set("text", (new Date()).format("db"));
        }
        //@upload message
        if (messageItem && messageItem.moduleMessage){
            if (messageItem.moduleMessage.setMessageText) messageItem.moduleMessage.setMessageText(text);
        }
    },
    setMessageTitle: function(messageItem, text){
        if (messageItem && messageItem.message) messageItem.subjectNode.set("text", text);
        //@upload message
        if (messageItem && messageItem.moduleMessage){
            if (messageItem.moduleMessage.setMessageTitle) messageItem.moduleMessage.setMessageTitle(text);
        }
    },
    clearMessageProgress: function(messageItem){
        if (messageItem && messageItem.message) {
            var progressNode = messageItem.contentNode.getFirst("div").getFirst("div");
            progressNode.destroy();
        }
        //@upload message
        if (messageItem && messageItem.moduleMessage){
            if (messageItem.moduleMessage.clearMessageProgress) messageItem.moduleMessage.clearMessageProgress();
        }
    },


    transferStart: function(e, xhr, messageItem){
        if (messageItem && messageItem.message) {
            this.setMessageText(messageItem, MWF.LP.desktop.action.sendStart);
            messageItem.status = "progress";
        }
        //@upload message
        if (messageItem && messageItem.moduleMessage){
            if (messageItem.moduleMessage.transferStart) messageItem.moduleMessage.transferStart();
        }
        this.fireEvent("loadstart");
    },
    transferFailed: function(e, xhr, messageItem){
        if (messageItem && messageItem.message) {
            this.setMessageText(messageItem, MWF.LP.desktop.action.sendError);
            this.setMessageTitle(messageItem, MWF.LP.desktop.action.sendError);
            this.clearMessageProgress(messageItem);
            messageItem.status = "failed";
        }
        //@upload message
        if (messageItem && messageItem.moduleMessage){
            if (messageItem.moduleMessage.transferFailed) messageItem.moduleMessage.transferFailed();
        }
        this.fireEvent("error");
    },
    transferCanceled: function(e, xhr, messageItem){
        if (messageItem && messageItem.message) {
            this.setMessageText(messageItem, MWF.LP.desktop.action.sendAbort);
            this.setMessageTitle(messageItem, MWF.LP.desktop.action.sendAbort);
            this.clearMessageProgress(messageItem);
            messageItem.status = "cancel";
        }
        //@upload message
        if (messageItem && messageItem.moduleMessage){
            if (messageItem.moduleMessage.transferCanceled) messageItem.moduleMessage.transferCanceled();
        }
        this.fireEvent("abort");
    },
    transferComplete: function(e, xhr, messageItem, currentDate, file){

        var sendDate = new Date();
        var ms = sendDate.getTime()-currentDate.getTime();
        var speed = (file.size)/ms;
        var u = "K/S";
        if (speed>1024){
            u = "M/S";
            speed = speed/1024;
        }
        if (speed>1024){
            u = "G/S";
            speed = speed/1024;
        }
        speed = speed.round(2);

        var timeStr = "";
        if (ms>3600000){
            var h = ms/3600000;
            var m_s = ms % 3600000;
            var m = m_s / 60000;
            var s_s = m_s % 60000;
            var s = s_s/1000;
            timeStr = ""+h.toInt()+MWF.LP.desktop.action.hour+m.toInt()+MWF.LP.desktop.action.minute+s.toInt()+MWF.LP.desktop.action.second;
        }else if (ms>60000){
            var m = ms / 60000;
            var s_s = ms % 60000;
            var s = s_s/1000;
            timeStr = ""+m.toInt()+MWF.LP.desktop.action.minute+s.toInt()+MWF.LP.desktop.action.second;
        }else{
            var s = ms/1000;
            timeStr = ""+s.toInt()+MWF.LP.desktop.action.second;
        }
        if (messageItem && messageItem.message) {
            this.setMessageText(messageItem, MWF.LP.desktop.action.uploadComplete + "  " + MWF.LP.desktop.action.speed + ": " + speed + u + "  " + MWF.LP.desktop.action.time + ": " + timeStr, MWF.LP.desktop.action.uploadComplete);
            this.setMessageTitle(messageItem, MWF.LP.desktop.action.uploadComplete);
            this.clearMessageProgress(messageItem);

            messageItem.status = "completed";
        }
        //@upload message

        if (messageItem && messageItem.moduleMessage){
            if (messageItem.moduleMessage.transferComplete) messageItem.moduleMessage.transferComplete();
        }
        //var msg = {
        //    "subject": MWF.LP.desktop.action.uploadComplete,
        //    "content": MWF.LP.desktop.action.uploadComplete+" : "+file.name
        //};
        //layout.desktop.message.addTooltip(msg);
        this.fireEvent("load");
    },
    updateProgress: function(e, xhr, messageItem, currentDate){
        var percent = 100*(e.loaded/e.total);

        var sendDate = new Date();
        var ms = sendDate.getTime()-currentDate.getTime();
        var speed = (e.loaded)/ms;
        var u = "K/S";
        if (speed>1024){
            u = "M/S";
            speed = speed/1024;
        }
        if (speed>1024){
            u = "G/S";
            speed = speed/1024;
        }
        speed = speed.round(2);

        if (messageItem && messageItem.message) {
            if (messageItem.contentNode) {
                var progressNode = messageItem.contentNode.getFirst("div").getFirst("div");
                var progressPercentNode = progressNode.getFirst("div");
                var progressInforNode = messageItem.contentNode.getFirst("div").getLast("div");
                progressPercentNode.setStyle("width", "" + percent + "%");
                progressInforNode.set("text", MWF.LP.desktop.action.sendStart + ": " + speed + u);
            }
        }
        //@upload message

        if (messageItem && messageItem.moduleMessage){
            if (messageItem.moduleMessage.updateProgress) messageItem.moduleMessage.updateProgress(percent);
        }
        this.fireEvent("progress");
    },
    xhrStateChange: function(e, xhr, messageItem, callback){
        if (xhr.readyState != 4) return;

        var status = xhr.status;
        status = (status == 1223) ? 204 : status;

        if ((status >= 200 && status < 300)){
            var json = JSON.decode(xhr.responseText);
            if (json){
                switch(json.type) {
                    case "success":
                        var dataId = "";
                        var t = typeOf(json.data);
                        if (t=="array"){
                            dataId = json.data[0].id;
                        }
                        if (t=="object"){
                            dataId = json.data.id;
                        }

                        MWF.runCallback(callback, "success", [{
                            "type": "success",
                            "id": dataId,
                            "messageId": (messageItem && messageItem.moduleMessage) ? messageItem.moduleMessage.data.id : "",
                            "data": json.data
                        }, xhr.responseText]);
                        break;
                    case "warn":
                        MWF.xDesktop.notice("info", {x: "right", y:"top"}, json.errorMessage.join("\n"));

                        var dataId = "";
                        var t = typeOf(json.data);
                        if (t=="array"){
                            dataId = json.data[0].id;
                        }
                        if (t=="object"){
                            dataId = json.data.id;
                        }
                        MWF.runCallback(callback, "success", [{
                            "type": "success",
                            "id": dataId
                        }, xhr.responseText]);
                        break;
                    case "error":
                        var messageId = (messageItem && messageItem.moduleMessage) ? messageItem.moduleMessage.data.id : "";
                        if( messageId && xhr )xhr.messageId = messageId;
                        MWF.runCallback(callback, "failure", [xhr]);
                        break;
                }
            }else{
                var messageId = (messageItem && messageItem.moduleMessage) ? messageItem.moduleMessage.data.id : "";
                if( messageId && xhr )xhr.messageId = messageId;
                MWF.runCallback(callback, "failure", [xhr]);
            }
        }else{
            var messageId = (messageItem && messageItem.moduleMessage) ? messageItem.moduleMessage.data.id : "";
            if( messageId && xhr )xhr.messageId = messageId;
            MWF.runCallback(callback, "failure", [xhr]);
        }
    },

    invokeFormDataWithoutProgress: function(xhr, method, uri, data, file, callback, async, progress){
        var messageItem = null;
        var currentDate = new Date();

        xhr.addEventListener("readystatechange", function(e){
            if (xhr.readyState == 4){
                if(file){
                    this.transferComplete(e, xhr, messageItem, currentDate, file);
                }
                this.xhrStateChange(e, xhr, messageItem, callback);
            }
        }.bind(this), false);

        xhr.open(method, uri, true);
        xhr.withCredentials = true;
        var token = (layout.config && layout.config.sessionStorageEnable) ? sessionStorage.getItem("o2LayoutSessionToken") : "";
        if (!token) {
            token = (layout.session && layout.session.user) ? (layout.session.token || layout.session.user.token) : "";
        }
        if (token) {
            xhr.setRequestHeader("Authorization", token);
        }

        messageItem = this.addFormDataMessage(file, true, xhr, progress);
        xhr.send(data);
        this.setMessageText(messageItem, MWF.LP.desktop.action.sendStart);
    },
    invokeFormDataWithForm: function(xhr, method, uri, data, file, callback, async){
        MWF.O2UploadCallback = callback;
        MWF.O2UploadCallbackFun = function(){
            if (MWF.O2UploadCallback) MWF.O2UploadCallback();
        };
        var div = data.items[0].value.el.getParent();
        div.set("styles", {
            "width": "500px",
            "height": "300px",
            "background-color": "#999999",
            "position": "absolute",
            "top": "100px",
            "left": "100px",
            "z-index": "30000",
            "display": "block"
        }).inject(document.body);

        var formNode = new Element("form", {
            "method": method,
            "action": (uri.indexOf("?")!=-1) ? uri+"&callback=MWF.O2UploadCallbackFun" : uri+"?callback=MWF.O2UploadCallbackFun",
            "enctype": "multipart/form-data",
            "target": "o2_upload_iframe"
        }).inject(div);
        var iframe = new Element("iframe", {
            "name": "o2_upload_iframe"
        }).inject(div);
        data.items.each(function(item){
            if (typeOf(item.value)=="string"){
                new Element("input", {
                    "name": item.name,
                    "value": item.value
                }).inject(formNode);
            }else{
                item.value.el.inject(formNode);
                item.value.el.set("name", item.name);
            }
        }.bind(this));
        var submitNode = new Element("input", {
            "type": "submit"
        }).inject(formNode);
        //   formNode.submit();
    },

    invokeFormData: function(method, uri, data, file, callback, async, progress){
        uri = o2.filterUrl(uri);
        var xhr = new COMMON.Browser.Request();
        if(file){
            data.append('fileName', file.name);
        }

        if (data.type==="o2_formdata"){
            this.invokeFormDataWithForm(xhr, method, uri, data, file, callback, async);
        }else{
            if (xhr.upload){
                this.invokeFormDataWithProgress(xhr, method, uri, data, file, callback, async, progress);
            }else{
                this.invokeFormDataWithoutProgress(xhr, method, uri, data, file, callback, async, progress);
            }
        }
        return xhr;
    },
    addFormDataMessage: function(file, noProgress, xhr, showMsg){

        if (layout.desktop.message){
            var contentHTML = "";
            if (noProgress){
                contentHTML = "<div style=\"height: 20px; line-height: 20px\">"+MWF.LP.desktop.action.sendReady+"</div></div>" ;
            }else{
                contentHTML = "<div style=\"overflow: hidden\"><div style=\"height: 3px; border:1px solid #999; margin: 3px 0px\">" +
                    "<div style=\"height: 3px; background-color: #acdab9; width: 0px;\"></div></div>" +
                    "<div style=\"height: 20px; line-height: 20px\">"+MWF.LP.desktop.action.sendReady+"</div></div>" ;
            }
            var msg = {
                "subject": MWF.LP.desktop.action.uploadTitle,
                //"content": MWF.LP.desktop.action.uploadTitle+" : "+file.name+"<br/>"+contentHTML
                "content": ( file.name ? (o2.txt(file.name)+"<br/>") : "" )+contentHTML
            };

            var messageItem = layout.desktop.message.addMessage(msg);

            //var _self = this;
            messageItem.close = function(callback, e){
                if (this.status=="progress"){
                    var flag = false;
                    var name = o2.txt(file.name||"");
                    name = name.length > 50 ? name.substr(0, 50)+"..." : name;
                    var text = MWF.LP.desktop.action.cancelUpload.replace(/{name}/g, (name));
                    MWF.xDesktop.confirm("wram", e, MWF.LP.desktop.action.cancelUploadTitle, text, "400", "180", function(){
                        xhr.abort();
                        //xhr.upload.timeout = 1;
                        this.close();
                        //messageItem.closeItem();
                    }, function(){
                        this.close()
                    });
                    //MWF.LP.desktop.action.sendStart
                }else{
                    messageItem.closeItem(callback, e);
                }
            };
        }

        //@upload message
        if (this.targetModule){
            var moduleMessage = this.targetModule.module.addFormDataMessage(this.targetModule.file);
            if (!messageItem) messageItem  ={};
            messageItem.moduleMessage = moduleMessage;
            this.targetModule = null;
        }

        //messageItem.addEvent("close", function(flag, e){
        //    debugger;
        //    if (this.status=="progress"){
        //        flag = false;
        //        var text = MWF.LP.desktop.action.cancelUpload.replace(/{name}/g, file.name);
        //        MWF.xDesktop.confirm("wram", e, MWF.LP.desktop.action.cancelUploadTitle, text, "300", "120", function(){
        //            xhr.abort();
        //            this.close();
        //            //messageItem.closeItem();
        //        }, function(){
        //            this.close()
        //        });
        //        //MWF.LP.desktop.action.sendStart
        //    }
        //});

        if (showMsg){
            window.setTimeout(function(){
                if (layout.desktop.message) if (!layout.desktop.message.isShow) layout.desktop.message.show();
            }.bind(this), 300);
        }

        //msg = {
        //    "subject": MWF.LP.desktop.action.uploadTitle,
        //    "content": MWF.LP.desktop.action.uploadTitle+" : "+file.name
        //};
        //var tooltipItem = layout.desktop.message.addTooltip(msg);
        return messageItem;
    },
    getAuthentication: function(success, failure){
        this.invoke({
            "name": "authentication",
            "async": true,
            "success": function(json, responseText){
                if (json.data.tokenType!="anonymous"){
                    if (success) success(json);
                }else{
                    if (failure) failure(null, responseText, json.message);
                }
            },
            "failure": failure
        });
    },
    login: function(data, success, failure){
        var name = "login";
        //    if (data.credential.toLowerCase()=="xadmin") name = "loginAdmin";
        this.invoke({
            "name": name,
            "async": true,
            "data": data,
            "success": function(json, responseText){
                //if (json.data.authentication){
                if (json.data.tokenType!="anonymous"){
                    if (success) success(json);
                }else{
                    if (failure) failure(null, responseText, json.message);
                }
            },
            "failure": failure
        });
    },
    logout: function(success, failure){
        this.invoke({
            "name": "logout",
            "async": false,
            "success": success,
            "failure": failure
        });
    }

});

MWF.xDesktop.Actions.RestActions.Callback = new Class({
    initialize: function(success, failure, appendSuccess, appendFailure){
        this.success = success;
        this.failure = failure;
        this.appendSuccess = appendSuccess;
        this.appendFailure = appendFailure;
    },

    onSuccess: function(responseJSON, responseText){
        if (responseJSON){
            switch(responseJSON.type) {
                // case "success":
                //    if (this.appendSuccess) this.appendSuccess(responseJSON);
                //    if (this.success) return this.success(responseJSON, responseText);
                //    return responseJSON;
                //     break;
                case "warn":
                    //MWF.xDesktop.notice("info", {x: "right", y:"top"}, responseJSON.errorMessage.join("\n"));
                    if (this.appendSuccess) this.appendSuccess(responseJSON);
                    if (this.success) return this.success(responseJSON);
                    return responseJSON;
                    break;
                case "error":
                    return this.doError(null, responseText, responseJSON.message);
                    return responseJSON;
                    break;
                default:
                    if (this.appendSuccess) this.appendSuccess(responseJSON);
                    if (this.success) return this.success(responseJSON, responseText);
                    return responseJSON;
                    break;
            }
        }else{
            return this.doError(null, responseText, "");
        }
    },
    onRequestFailure: function(xhr){
        return this.doError(xhr, "", "");
    },
    onFailure: function(xhr, text, error){
        return this.doError(xhr, text, error);
    },
    onError: function(text, error){
        return this.doError(null, text, error);
    },
    doError: function(xhr, text, error){
        if (this.appendFailure) this.appendFailure(xhr, text, error);
        var flag = true;
        if (this.failure && this.failure.owner){
            if (this.failure.reject || (this.failure.rejectList && this.failure.rejectList.length)){
                return this.failure(xhr, text, error);
            }
            this.failure = null;
        }else{
            if (this.failure) flag = !this.failure(xhr, text, error);
        }
        //if (!this.failure && !this.appendFailure){
        if (flag && !this.appendFailure){
            if (xhr.status!=0){
                var errorText = error;
                if (xhr && xhr.status === 401){
                    // if (!layout.loginDlg) {
                    //     var json = JSON.decode(xhr.responseText);
                        
                    //     const node = new Element("div", {styles: {height: "100%"}});
                    //     const iframe = new Element("iframe", {
                    //         "src": '/x_desktop/index.html?redirect=/x_desktop/close.html&username='+layout.session.user.name,
                    //         "width": "100%",
                    //         "height": "100%",
                    //         "frameborder": "0",
                    //         "allowtransparency": "true",
                    //         "scrolling": "no"
                    //     }).inject(node);

                    //     layout.loginDlg = $OOUI.dialog(json.message.trim()+o2.LP.desktop.login.loginAgain, node, null, {
                    //         buttons: '', width: '80vw', height: '80vh', zIndex: 200000,
                    //         'events': {
                    //             'close': ()=>{
                    //                 console.log("close iframe")
                    //                 layout.loginDlg = null;
                    //             }
                    //         }
                    //     });
                    //     layout.loginDlg.dlg.closeDlg = ()=>{
                    //         layout.loginDlg.dlg.close();
                    //         layout.loginDlg = null;
                    //     }
                    // }

                }else{
                    var json = JSON.decode(xhr.responseText);
                    if (json){
                        errorText = json.message.trim() || "request json error";
                    }else{
                        errorText = "request json error: "+xhr.responseText;
                    }

                    errorText = errorText.replace(/\</g, "&lt;");
                    errorText = errorText.replace(/\</g, "&gt;");
                    if (layout.session && layout.session.user) MWF.xDesktop.notice("error", {x: "right", y:"top"}, errorText);
                }
            }
        }
        return  {"xhr": xhr, "text": text, "error":error};
    }
});

MWF.xAction = MWF.xAction || {};
//MWF.require("MWF.xDesktop.Actions.RestActions", null, false);

MWF.xAction.RestActions = MWF.Actions = {
    "actions": {},
    "loadedActions": {},
    "get": function(root){
        if (this.actions[root]) return this.actions[root];

        var actions = null;
        var url = o2.session.path+"/xAction/services/"+root+".json";
        MWF.getJSON(url, function(json){actions = json;}.bind(this), false, false, false);

        if (!MWF.xAction.RestActions.Action[root] && actions.clazz) MWF.require("MWF.xAction.services."+actions.clazz, null, false);
        if (!MWF.xAction.RestActions.Action[root]) MWF.xAction.RestActions.Action[root] = new Class({Extends: MWF.xAction.RestActions.Action});

        this.actions[root] = new MWF.xAction.RestActions.Action[root](root, actions);
        return this.actions[root];
    },
    "load": function(root){
        if (this.loadedActions[root]) return this.loadedActions[root];
        var jaxrs = null;
        //var url = this.getHost(root)+"/"+root+"/describe/describe.json";
        var url = this.getHost(root)+"/"+root+"/describe/api.json";
        //var url = "../o2_core/o2/xAction/temp.json";
        try{
            MWF.getJSON(url, function(json){jaxrs = json.jaxrs;}.bind(this), false, false, false);
            if (jaxrs){
                var actionObj = {};
                jaxrs.each(function(o){
                    if (o.methods && o.methods.length){
                        var actions = {};
                        o.methods.each(function(m){
                            var o = {"uri": "/"+m.uri};
                            if (m.method) o.method = m.method;
                            if (m.enctype) o.enctype = m.enctype;
                            actions[m.name] = o;
                        }.bind(this));
                        actionObj[o.name] = new MWF.xAction.RestActions.Action(root, actions);
                        //actionObj[o.name] = new MWF.xAction.RestActions.Action(root, o.methods);
                    }
                }.bind(this));
                this.loadedActions[root] = actionObj;
                return actionObj;
            }
        }catch(e){}
        return null;
    },
    //actions: [{"action": "", "subAction": "TaskAction", "name": "list", "par": [], "body": "",  "urlEncode"： false, "cache": false}]
    async: function(actions, callback){
        var cbs = (o2.typeOf(callback)==="function") ? callback : callback.success;
        var cbf = (o2.typeOf(callback)==="function") ? null : callback.failure;
        var res = [];
        var len = actions.length;
        var jsons = new Array(len-1);

        var cb = function(){
            if (res.length===len) cbs.apply(this, jsons);
        };
        var _doError = function(xhr, text, error){
            if (xhr.status!=0){
                var errorText = error;
                if (xhr){
                    var json = JSON.decode(xhr.responseText);
                    if (json){
                        errorText = json.message.trim() || "request json error";
                    }else{
                        errorText = "request json error: "+xhr.responseText;
                    }
                }
                MWF.xDesktop.notice("error", {x: "right", y:"top"}, errorText);
            }
        };

        actions.each(function(action, i){
            var actionArgs = action.par || [];
            actionArgs.push(function(json){
                jsons[i] = json;
                res.push(true);
                cb();
            });
            actionArgs.push(function(xhr, text, error){
                res.push(false);
                if (!cbf){
                    _doError(xhr, text, error);
                }else{
                    cbf();
                }
                cb();
            });
            actionArgs.push(true);
            actionArgs.push(action.urlEncode);
            actionArgs.push(action.cache);
            action.action[action.subAction][action.name].apply(action.action[action.subAction], actionArgs);
        });
    },

    //actions: [{"action": "", "name": "list", "par": [], "body": "",  "urlEncode"： false, "cache": false}]
    invokeAsync2: function(actions, callback){

        var cbs = (o2.typeOf(callback)==="function") ? callback : callback.success;
        var cbf = (o2.typeOf(callback)==="function") ? null : callback.failure;
        var res = [];
        var len = actions.length;
        var jsons = new Array(len-1);

        var cb = function(){
            if (res.length===len) cbs.apply(this, jsons);
        };
        var _doError = function(xhr, text, error){
            if (xhr.status!=0){
                var errorText = error;
                if (xhr){
                    var json = JSON.decode(xhr.responseText);
                    if (json){
                        errorText = json.message.trim() || "request json error";
                    }else{
                        errorText = "request json error: "+xhr.responseText;
                    }
                }
                MWF.xDesktop.notice("error", {x: "right", y:"top"}, errorText);
            }
        };

        actions.each(function(action, i){
            var actionArgs = action.par || [];
            actionArgs.push(function(json){
                jsons[i] = json;
                res.push(true);
                cb();
            });
            actionArgs.push(function(xhr, text, error){
                res.push(false);
                if (!cbf){
                    _doError(xhr, text, error);
                }else{
                    cbf();
                }
                cb();
            });
            actionArgs.push(true);
            actionArgs.push(action.urlEncode);
            actionArgs.push(action.cache);
            action.action[action.name].apply(action.action, actionArgs);
        });
    },

    "getHost": function(root){
        var addressObj = layout.serviceAddressList[root];
        var address = "";

        var defaultPort = layout.config.app_protocol==='https' ? "443" : "80";
        if (addressObj){
            var appPort = addressObj.port || window.location.port;
            address = layout.config.app_protocol+"//"+(addressObj.host || window.location.hostname)+ ((!appPort || appPort.toString()===defaultPort) ? "" : ":"+appPort);
        }else{
            var host = layout.desktop.centerServer.host || window.location.hostname;
            var port = layout.desktop.centerServer.port || window.location.port;
            //var mapping = layout.getCenterUrlMapping();
            address = layout.config.app_protocol+"//"+host+( (!port || port.toString()===defaultPort) ? "" : ":"+port);
        }
        return address;
    },
    "invokeAsync": function(actions, callback){
        var len = actions.length;
        var parlen = arguments.length-2;
        var res = [];
        var jsons = new Array(len-1);
        var args = arguments;

        var cbs = (o2.typeOf(callback)==="function") ? callback : callback.success;
        var cbf = (o2.typeOf(callback)==="function") ? null : callback.failure;

        var cb = function(){
            if (res.length===len) cbs.apply(this, jsons);
        };
        var _doError = function(xhr, text, error){
            if (xhr.status!=0){
                var errorText = error;
                if (xhr){
                    var json = JSON.decode(xhr.responseText);
                    if (json){
                        errorText = json.message.trim() || "request json error";
                    }else{
                        errorText = "request json error: "+xhr.responseText;
                    }
                }
                MWF.xDesktop.notice("error", {x: "right", y:"top"}, errorText);
            }
        };

        actions.each(function(action, i){
            var par = (i<parlen) ? args[i+2] : args[parlen+1];
            if (par){
                var actionArgs = (o2.typeOf(par)==="array") ? par : [par];
                actionArgs.unshift(function(xhr, text, error){
                    res.push(false);
                    if (!cbf){
                        _doError(xhr, text, error);
                    }else{
                        cbf();
                    }
                    cb();
                    return true;
                });
                //actionArgs.unshift(null);
                actionArgs.unshift(function(json){
                    jsons[i] = json;
                    res.push(true);
                    cb();
                });

                var p = action.action[action.name].apply(action.action, actionArgs);
                // p.catch(function(xhr, text, error){
                //     res.push(false);
                //     if (!cbf){
                //         _doError(xhr, text, error);
                //     }else{
                //         cbf();
                //     }
                //     cb();
                // })

            }else{
                action.action[action.name](function(){
                    jsons[i] = json;
                    res.push(true);
                    cb();
                }, function(xhr, text, error){
                    res.push(false);
                    if (!cbf){
                        _doError(xhr, text, error);
                    }else{
                        cbf();
                    }
                    cb();
                });
            }
        });
    }
};
MWF.xAction.RestActions.Action = new Class({
    initialize: function(root, actions){
        this.action = new MWF.xDesktop.Actions.RestActions("/xAction/services/"+root+".json", root, "");
        this.action.actions = actions;

        Object.each(this.action.actions, function(service, key){
            if (service.uri) if (!this[key]) this.createMethod(service, key);
        }.bind(this));
    },
    createMethod: function(service, key){
        var jaxrsUri = service.uri;
        var re = new RegExp("\{.+?\}", "g");
        var replaceWords = jaxrsUri.match(re);
        var parameters = [];
        if (replaceWords) parameters = replaceWords.map(function(s){
            return s.substring(1,s.length-1);
        });

        this[key] = this.invokeFunction(service, parameters, key);
    },
    invokeFunction: function(service, parameters, key){
        //uri的参数, data(post, put), file(formData), success, failure, async
        return function(){
            var i = parameters.length-1;
            var n = arguments.length;
            var functionArguments = arguments;
            var parameter = {};
            var success, failure, async, data, file;
            if (typeOf(functionArguments[0])==="function"){
                i=-1;
                success = (n>++i) ? functionArguments[i] : null;
                failure = (n>++i) ? functionArguments[i] : null;
                parameters.each(function(p, x){
                    parameter[p] = (n>++i) ? functionArguments[i] : null;
                });
                if (service.method && (service.method.toLowerCase()==="post" || service.method.toLowerCase()==="put")){
                    if ((!service.enctype) || service.enctype.toLowerCase()!=="formdata"){
                        data = (n>++i) ? functionArguments[i] : null;
                    }else{
                        data = (n>++i) ? functionArguments[i] : null;
                        file = (n>++i) ? functionArguments[i] : null;
                    }
                }
                async = (n>++i) ? functionArguments[i] : null;
                urlEncode = (n>++i) ? functionArguments[i] : true;
                cache = (n>++i) ? functionArguments[i] : (Browser.name != "ie");
            }else{
                parameters.each(function(p, x){
                    parameter[p] = (n>x) ? functionArguments[x] : null;
                });
                if (service.method && (service.method.toLowerCase()==="post" || service.method.toLowerCase()==="put")){
                    if ((!service.enctype) || service.enctype.toLowerCase()!=="formdata"){
                        data = (n>++i) ? functionArguments[i] : null;
                    }else{
                        data = (n>++i) ? functionArguments[i] : null;
                        file = (n>++i) ? functionArguments[i] : null;
                    }
                }
                success = (n>++i) ? functionArguments[i] : null;
                failure = (n>++i) ? functionArguments[i] : null;
                async = (n>++i) ? functionArguments[i] : null;
                urlEncode = (n>++i) ? functionArguments[i] : true;
                cache = (n>++i) ? functionArguments[i] : (Browser.name != "ie");
            }
            return this.invoke(service,{"name": key, "async": async, "data": data, "file": file, "parameter": parameter, "success": success, "failure": failure, "urlEncode": urlEncode, "cache": cache});
            //if (!cache) debugger;
            //return this.action.invoke({"name": key, "async": async, "data": data, "file": file, "parameter": parameter, "success": success, "failure": failure, "urlEncode": urlEncode, "cache": cache});
        }.bind(this);
    },
    invoke: function(service, options){
        return this.action.invoke(options);
    }
});


MWF.xDesktop = MWF.xDesktop || {};
MWF.xApplication = MWF.xApplication || {};
//MWF.xDesktop.requireApp("Organization", "Actions.RestActions", null, false);

MWF.xDesktop.Access = MWF.AC = {
    "companyList": null,
    "action": null,

    getRoleList: function(){
        if (!this.roleList){
            this.roleList = [];
            layout.desktop.session.user.roleList.each(function(role){
                this.roleList.push(role.substring(0, role.indexOf("@")).toLowerCase());
            }.bind(this));
        }
    },
    isAdministrator: function(){
        this.getRoleList();
        return (layout.desktop.session.user.name.toLowerCase() === "xadmin") || (this.roleList.indexOf("manager")!==-1) || (this.roleList.indexOf("systemmanager")!==-1);
    },
    isManager: function(){
        this.getRoleList();
        return (layout.desktop.session.user.name.toLowerCase() === "xadmin") || (this.roleList.indexOf("manager")!==-1);
    },
    isProcessManager: function(){
        if (!layout.desktop.session.user.roleList) return false;
        this.getRoleList();
        return this.isAdministrator() || (this.roleList.indexOf("processplatformmanager")!==-1);
    },
    isPortalManager: function(){
        if (!layout.desktop.session.user.roleList) return false;
        this.getRoleList();
        return this.isAdministrator() || (this.roleList.indexOf("portalmanager")!==-1);
    },
    isPortalCreator: function(){
        if (!layout.desktop.session.user.roleList) return false;
        this.getRoleList();
        return this.isAdministrator() || (this.roleList.indexOf("portalmanager")!==-1) || (this.roleList.indexOf("portalcreator")!==-1);
    },
    isQueryManager: function(){
        if (!layout.desktop.session.user.roleList) return false;
        this.getRoleList();
        return this.isAdministrator() || (this.roleList.indexOf("querymanager")!==-1);
    },
    isQueryCreator: function(){
        if (!layout.desktop.session.user.roleList) return false;
        this.getRoleList();
        return this.isAdministrator() || (this.roleList.indexOf("querymanager")!==-1) || (this.roleList.indexOf("querycreator")!==-1);
    },
    isOrganizationManager: function(){
        if (!layout.desktop.session.user.roleList) return false;
        this.getRoleList();
        return this.isAdministrator() || (this.roleList.indexOf("organizationmanager")!==-1);
    },
    isMessageManager: function(){
        if (!layout.desktop.session.user.roleList) return false;
        this.getRoleList();
        return this.isAdministrator() || (this.roleList.indexOf("messagemanager")!==-1);
    },
    isServiceManager: function(){
        if (!layout.desktop.session.user.roleList) return false;
        this.getRoleList();
        return this.isAdministrator() || (this.roleList.indexOf("servicemanager")!==-1);
    },

    isUnitManager: function(){
        if (!layout.desktop.session.user.roleList) return false;
        this.getRoleList();
        return this.isAdministrator() || (this.roleList.indexOf("unitmanager")!==-1);
    },
    isGroupManager: function(){
        if (!layout.desktop.session.user.roleList) return false;
        this.getRoleList();
        return this.isAdministrator() || (this.roleList.indexOf("groupmanager")!==-1);
    },
    isRoleManager: function(){
        if (!layout.desktop.session.user.roleList) return false;
        this.getRoleList();
        return this.isAdministrator() || (this.roleList.indexOf("rolemanager")!==-1);
    },
    isPersonManager: function(){
        if (!layout.desktop.session.user.roleList) return false;
        this.getRoleList();
        return this.isAdministrator() || (this.roleList.indexOf("personmanager")!==-1);
    },
    isSystemManager: function(){
        if (!layout.desktop.session.user.roleList) return false;
        this.getRoleList();
        return (this.roleList.indexOf("systemmanager")!==-1);
    },
    isSecurityManager: function(){
        if (!layout.desktop.session.user.roleList) return false;
        this.getRoleList();
        return (this.roleList.indexOf("securitymanager")!==-1);
    },
    isAuditManager: function(){
        if (!layout.desktop.session.user.roleList) return false;
        this.getRoleList();
        return (this.roleList.indexOf("auditmanager")!==-1);
    },

    isGroupCreator: function(){
        if (!layout.desktop.session.user.roleList) return false;
        this.getRoleList();
        return (this.roleList.indexOf("groupcreator")!==-1);
    },
    isProcessPlatformCreator: function(){
        if (this.isAdministrator()) return true;
        if (this.isProcessManager()) return true;
        if (!layout.desktop.session.user.roleList) return false;
        this.getRoleList();
        return (this.roleList.indexOf("processplatformcreator")!==-1);
    },
    isPortalPlatformCreator: function(){
        if (this.isAdministrator()) return true;
        if (this.isPortalCreator()) return true;
        if (!layout.desktop.session.user.roleList) return false;
        this.getRoleList();
        return (this.roleList.indexOf("portalcreator")!==-1);
    },

    isQueryPlatformCreator: function(){
        if (this.isAdministrator()) return true;
        if (this.isQueryCreator()) return true;
        if (!layout.desktop.session.user.roleList) return false;
        this.getRoleList();
        return (this.roleList.indexOf("querycreator")!==-1);
    },
    isApplicationManager: function(option){
        if (this.isAdministrator()) {
            if (option.yes) option.yes();
        }else{

        }
    },
    isCMSManager: function(){
        this.getRoleList();
        return this.isAdministrator() || (this.roleList.indexOf("cmsmanager")!==-1);
    },
    isCMSCreator: function(){
        this.getRoleList();
        return this.isAdministrator() || (this.roleList.indexOf("cmsmanager")!==-1) || (this.roleList.indexOf("cmscreator")!==-1);
    },
    isBBSManager: function(){
        this.getRoleList();
        return this.isAdministrator() || (this.roleList.indexOf("bbsmanager")!==-1) || (this.roleList.indexOf("bssmanager")!==-1);
    },
    isOKRManager: function(){
        this.getRoleList();
        return this.isAdministrator() || (this.roleList.indexOf("okrmanager")!==-1);
    },
    isCRMManager: function(){
        this.getRoleList();
        return this.isAdministrator() || (this.roleList.indexOf("crmmanager")!==-1);
    },
    isAttendanceManager: function(){
        this.getRoleList();
        return this.isAdministrator() || (this.roleList.indexOf("attendancemanager")!==-1);
    },
    isMeetingAdministrator: function(){
        this.getRoleList();
        return this.isAdministrator() || (this.roleList.indexOf("meetingmanager")!==-1);
    },
    isHotPictureManager: function(){
        this.getRoleList();
        return this.isAdministrator() || (this.roleList.indexOf("hotpicturemanager")!==-1);
    },
    isPersonEditor: function(option){
        //{list: "idlist", "yes": trueFunction, "no": falseFunction}
        if (this.isAdministrator()) return true;
        if (this.isPersonManager()) return true;
        if (option.list && option.list.length){
            if (option.list.indexOf(layout.desktop.session.user.id)!==-1) return true;
        }
        return false;
    },
    isCompanyEditor: function(option) {
        //{id: "companyId", "yes": trueFunction, "no": falseFunction}
        if (this.isAdministrator()){
            if (option.yes) option.yes();
        }else if (this.isCompanyCreator()){
            if (option.yes) option.yes();
        }else{
            this.getCompanyList(function(){
                if (option.id){
                    if (this.companyList.indexOf(option.id)!==-1){
                        if (option.yes) option.yes();
                    }else{
                        if (option.no) option.no();
                    }
                }else{
                    if (this.companyList.length>0){
                        if (option.yes) option.yes();
                    }else{
                        if (option.no) option.no();
                    }
                }
            }.bind(this));
        }
    },
    isDepartmentEditor: function(option) {
        //{id: "superCompanyId", "yes": trueFunction, "no": falseFunction}
        if (this.isAdministrator()){
            if (option.yes) option.yes();
        }else if (this.isCompanyCreator()){
            if (option.yes) option.yes();
        }else{
            this.getCompanyList(function(){
                if (option.id){
                    if (this.companyList.indexOf(option.id)!==-1){
                        if (option.yes) option.yes();
                    }else{
                        if (option.no) option.no();
                    }
                }else{
                    if (option.no) option.no();
                }
            }.bind(this));
        }
    },

    getCompanyList: function(callback){
        if (this.companyList===null){
            this.getAction();
            this.action.getCompanyAccess(function(json){
                if (json.data){
                    this.companyList = json.data;
                }else{
                    this.companyList = [];
                }
                if (callback) callback();
            }.bind(this), null, layout.desktop.session.user.id);
        }else{
            if (callback) callback();
        }
    },
    getAction: function(){
        if (!this.action) this.action = MWF.Actions.get("x_organization_assemble_control");
        //if (!this.action) this.action = new MWF.xApplication.Organization.Actions.RestActions();
    }

}

o2.require("MWF.widget.Dialog", null, false);
o2.xDesktop.Dialog = o2.DDL = new Class({
	Extends: o2.widget.Dialog,
    options : {
	    "zindex": null,
        "maxHeightPercent": "98%"
    },
//	_markShow: function(){
//
//		if (this.options.mark){
//			if (!this.markNode){
//
//				this.markNode = new Element("div", {
//					styles: this.css.mark
//				}).inject($(document.body));
//
//			}
////			if (this.options.markNode){
////				var size = this.options.markNode.getComputedSize();
////				var position = this.options.markNode.getPosition();
////				alert(size.totalHeight);
////				this.markNode.set("styles", {
////					"height": size.totalHeight+"px",
////					"width": size.totalWidth+"px",
////					"top": position.y,
////					"height": position.x
////				});
////
////			}else{
//				var size = MWF.getMarkSize();
//				this.markNode.set("styles", {
//					"height": size.y,
//					"width": size.x,
//					"top": "0xp",
//					"height": "0px"
//				});
////			}
//
//			this.markNode.setStyle("display", "block");
//		}
//	},
	_markShow: function(){

		if (this.options.mark){
			if (!this.markNode){
				var size = MWF.getMarkSize(this.options.maskNode);
				var topNode = this.options.container || $(document.body);

                this.markNode = new Element("iframe", {
                    styles: this.css.mark
                }).inject(topNode);
                this.markNode.set("styles", {
                    "height": size.y,
                    "width": size.x
                });
				if (!this.markNode_up) this.markNode_up = new Element("div", { styles: this.css.mark }).inject(topNode);
                this.markNode_up.set("styles", {
                    "height": size.y,
                    "width": size.x
                });
			}
			this.markNode.setStyle("display", "block");
		}
	},
    setZindex: function(){
        if( o2.typeOf(this.options.zindex) === "number" && this.options.zindex > 0 ){
            this.css = Object.clone(this.css);
            this.css.from["z-index"] = this.options.zindex.toString();
            this.css.to["z-index"] = this.options.zindex.toString();
            this.css.mark["z-index"] = (this.options.zindex-1).toString();
        }
    },
	getDialogNode: function(){
        this.setZindex();

        this.width = this.options.width;
        this.height = this.options.height;

		this.node.set("styles", this.css.from);
		var topNode = this.options.container || $(document.body);
		this.node.inject(topNode);
//		this.node.addEvent("selectstart", function(e){
//		//	e.preventDefault();
//		});

		this.title = this.node.getElement(".MWF_dialod_title");
		this.titleCenter = this.node.getElement(".MWF_dialod_title_center");
		this.titleText = this.node.getElement(".MWF_dialod_title_text");
		this.titleAction = this.node.getElement(".MWF_dialod_title_action");
		this.content = this.node.getElement(".MWF_dialod_content");
		this.bottom = this.node.getElement(".MWF_dialod_bottom");
		this.resizeNode = this.node.getElement(".MWF_dialod_bottom_resize");
		this.button = this.node.getElement(".MWF_dialod_button");
        if( (!this.options.buttonList || this.options.buttonList.length === 0) && ( !this.options.buttons ) ){
            this.button.setStyle("display","none");
            this.buttonDisable = true;
        }else{
            this.okButton = this.node.getElement(".MWF_dialod_ok_button");
            this.cancelButton = this.node.getElement(".MWF_dialod_cancel_button");
        }
        this.backAction = this.node.getElement(".MWF_dialod_Action_back");

        if (!this.options.isTitle) {
            this.title.destroy();
            this.title = null;
            this.titleCenter = null;
            this.titleRefresh = null;
            this.titleText = null;
            this.titleAction = null;
        }

		if (this.title) this.setTitleEvent();
	//	if (this.titleText) this.getTitle();
		if (this.content) this.getContent();
		if (this.titleAction) this.getAction();
		if (this.resizeNode) this.setResizeNode();
	//	if (this.button) this.getButton();

		if (this.content) this.setContentSize();
        if (this.backAction)this.backAction.addEvent("click", this.close.bind(this))
	},
    getButton: function(){
        Object.each(this.options.buttons, function (fun, i){
            var button = new Element("input", {
                "type": "button",
                "value": i,
                "styles": this.css.button,
                "class": "mainColor_bg",
                "events": {
                    "click": function (e){
                        this.deounceButton(button);
						fun.call(this, this, e);
					}.bind(this)
                }
            }).inject(this.button);
        }.bind(this));
        // for (i in this.options.buttons){
        //     var button = new Element("input", {
        //         "type": "button",
        //         "value": i,
        //         "styles": this.css.button,
        //         "class": "mainColor_bg",
        //         "events": {
        //             "click": this.options.buttons[i].bind(this)
        //         }
        //     }).inject(this.button);
        // }
        if (this.options.buttonList){
            this.options.buttonList.each(function(bt){
                var styles = this.css.button;
                if( bt.type === "ok" && this.css.okButton )styles = this.css.okButton;
                if( bt.type === "cancel" && this.css.cancelButton )styles = this.css.cancelButton;
                if( bt.styles )styles = bt.styles;
                var button;
                if( bt.type === "ok" && this.okButton ){
                    button = this.okButton;
                    button.show();
                }else if( bt.type === "cancel" && this.cancelButton ){
                    button = this.cancelButton;
                    button.show();
                }else{
                    if( !bt.tag ){
                        button = new Element("input", {
                            "type": "button"
                        }).inject(this.button);
                    }else{
                        button = new Element( bt.tag, {}).inject(this.button);
                    }
                }

                if( button.get("type") === "button" ){
                    button.set({
                        "value": bt.text,
                        "title": bt.title,
                        "styles": styles,
                        "class": (bt.type!=="cancel") ? "mainColor_bg" : "",
                        "events": {
                            "click": function(e){
                                this.deounceButton(button);
                                bt.action.call(this, this, e);
                            }.bind(this)
                        }
                    })
                }else{
                    button.set({
                        "text": bt.text,
                        "title": bt.title,
                        "styles": styles,
                        "class": (bt.type!=="cancel") ? "mainColor_bg" : "",
                        "events": {
                            "click": function(e){bt.action.call(this, this, e)}.bind(this)
                        }
                    })
                }
            }.bind(this));
        }
    },
    setTitleEvent: function(){
        var content;
        if( this.options.isMove ){
            if (layout.app) content = layout.app.content;
            if (layout.desktop.currentApp) content = layout.desktop.currentApp.content;
            this.containerDrag = new Drag.Move(this.node, {
                "handle": this.title,
                "container": this.options.positionNode || this.options.container || this.markNode || content,
                "snap": 5
            });
        }
    },
    getAction: function(){
        //未完成................................
        if (this.options.isClose){
            this.closeAction = new Element("div", {"styles": this.css.closeAction}).inject(this.titleAction);
            this.closeAction.addEvent("click", this.close.bind(this));
        }
        if (this.options.isMax){
            this.maxAction = new Element("div", {"styles": this.css.maxAction}).inject(this.titleAction);
            this.maxAction.addEvent("click", this.maxSize.bind(this));

            this.restoreAction = new Element("div", {"styles": this.css.restoreAction}).inject(this.titleAction);
            this.restoreAction.hide();
            this.restoreAction.addEvent("click", this.restoreSize.bind(this));

            if (this.title){
                this.title.addEvent("dblclick", function(){
                    this.switchMax();
                }.bind(this));
            }
        }
    },
    switchMax : function(){
        if( !this.isMax ){
            this.maxSize();
        }else{
            this.restoreSize();
        }
    },
    maxSize: function(){
        //if(!this.oldCoordinate)this.oldCoordinate = {
        //    height : this.options.height,
        //    width : this.options.width,
        //    top : this.options.top,
        //    left : this.options.left,
        //    fromTop : this.options.fromTop,
        //    fromLeft : this.options.fromLeft,
        //    contentHeight : this.options.contentHeight,
        //    contentWidth : this.options.contentWidth,
        //    maxHeightPercent : this.options.maxHeightPercent,
        //    maxHeight : this.options.maxHeight,
        //    maxWidth : this.options.maxWidth
        //};
        //if( !this.oldSize ){
        //    this.oldSize = {
        //        "width" : this.width,
        //        "height" : this.height
        //    }
        //}
        if( !this.oldNodeSize ){
            this.oldNodeSize = {
                "width" : this.nodeWidth,
                "height" : this.nodeHeight
            }
        }
        if( !this.oldContentSize ){
            this.oldContentSize = {
                "width" : this.contentWidth,
                "height" : this.contentHeight
            }
        }

        var container = $(document.body);
        if (layout.desktop.currentApp){
            container = layout.desktop.currentApp.content;
        }else if (this.options.container){
            if (this.options.container.getSize().y<$(document.body).getSize().y){
                container = this.options.container;
            }
        }
        var containerSize = container.getSize();
        this.options.width = containerSize.x;
        this.options.height = containerSize.y;

        this.setContentSize( containerSize.y, containerSize.x );
        this.node.setStyles({
            width : containerSize.x + "px",
            height : containerSize.y + "px",
            top : "0px",
            left : "0px"
        });

        this.maxAction.setStyle("display","none");
        this.restoreAction.setStyle("display","");
        this.isMax = true;
        this.fireEvent("max");
    },
    restoreSize : function(){

        this.contentHeight = this.oldContentSize.height;
        this.contentWidth = this.oldContentSize.width;

        this.nodeHeight = this.oldNodeSize.height;
        this.nodeWidth = this.oldNodeSize.width;

        this.content.setStyles( this.oldContentSize );

        this.node.setStyles( this.oldNodeSize );

        this.reCenter();

        this.maxAction.setStyle("display","");
        this.restoreAction.setStyle("display","none");
        this.isMax = false;
        this.fireEvent("restore");
    },
    reCenter: function(){
	    var size;
	    if( this.node.offsetParent === null ){ //如果是隐藏的
            size = this.node.measure(function(){
                return this.getSize();
            });
        }else{
            size = this.node.getSize();
        }

        if( this.options.positionWidth ){
            size.x = parseInt(this.options.positionWidth);
        }
        if( this.options.positionHeight ){
            size.y = parseInt(this.options.positionHeight);
        }

        var container = layout.desktop.currentApp ? layout.desktop.currentApp.content : $(document.body);
        var bodySize = container.getSize();
        if( this.options.positionNode ){
            var positionNodeSize = this.options.positionNode.getSize();
            if(positionNodeSize.y<bodySize.y || positionNodeSize.x < bodySize.x){
                container = this.options.positionNode;
            }
        }else{
            if (this.options.container){
                var cSize = this.options.container.getSize();
                if (cSize.y<bodySize.y || cSize.x<bodySize.x){
                    container = this.options.container;
                }
            }
        }

        var p = o2.getCenter(size, container, container);
        if (p.y< ( this.options.minTop || 0 ) ) p.y = this.options.minTop || 0;
        this.options.top = p.y;
        this.options.left = p.x;
        this.css.to.top = this.options.top+"px";
        this.css.to.left = this.options.left+"px";
        this.node.setStyles({
            "top": this.css.to.top,
            "left": this.css.to.left
        });
    },
    getOffsetY : function(node){
        return (node.getStyle("margin-top").toInt() || 0 ) +
            (node.getStyle("margin-bottom").toInt() || 0 ) +
            (node.getStyle("padding-top").toInt() || 0 ) +
            (node.getStyle("padding-bottom").toInt() || 0 )+
            (node.getStyle("border-top-width").toInt() || 0 ) +
            (node.getStyle("border-bottom-width").toInt() || 0 );
    },
    getOffsetX : function(node){
        return (node.getStyle("margin-left").toInt() || 0 ) +
            (node.getStyle("margin-right").toInt() || 0 ) +
            (node.getStyle("padding-left").toInt() || 0 ) +
            (node.getStyle("padding-right").toInt() || 0 )+
            (node.getStyle("border-left-width").toInt() || 0 ) +
            (node.getStyle("border-right-width").toInt() || 0 );
    },
    getMarginY : function(node){
        return (node.getStyle("margin-top").toInt() || 0 ) +
            (node.getStyle("margin-bottom").toInt() || 0 );
    },
    getMarginX : function(node){
        return (node.getStyle("margin-left").toInt() || 0 ) +
            (node.getStyle("margin-right").toInt() || 0 );
    },
    getContentMaxHeight: function(){
        var maxHeight = this.getMaxHeight();
        var offsetY = 0;
        if( this.title )offsetY = offsetY + this.getOffsetY( this.title ) + this.title.getSize().y;
        if( this.bottom )offsetY = offsetY + this.getOffsetY( this.bottom ) + this.bottom.getSize().y;
        if( this.button && !this.buttonDisable )offsetY = offsetY + this.getOffsetY( this.button ) + this.button.getSize().y;
        if( this.content )offsetY = offsetY + this.getMarginY( this.content );
        return maxHeight - offsetY;
    },
    setContentHeightAuto : function(){
        var maxHeight = this.getMaxHeight();

        var offsetY = 0;
        var y = 0;
        //y = y + getOffsetY( this.title ) + this.title.getSize().y; //this.titleNode.getStyle("height").toInt();
        if( this.title )offsetY = offsetY + this.getOffsetY( this.title ) + this.title.getSize().y;
        if( this.bottom )offsetY = offsetY + this.getOffsetY( this.bottom ) + this.bottom.getSize().y;
        if( this.button && !this.buttonDisable )offsetY = offsetY + this.getOffsetY( this.button ) + this.button.getSize().y;
        if( this.content ){
            offsetY = offsetY + this.getMarginY( this.content );
            y = offsetY + this.content.getSize().y;
        }else{
            y = offsetY;
        }


        if (  typeOf(maxHeight) === "number" && y > maxHeight) {
            this.options.height = maxHeight;
            this.options.contentHeight = null;
            this.options.fromTop = this.options.fromTop.toFloat() - offsetY / 2;
            this.options.top = this.options.top.toFloat() - offsetY / 2;
            this.css.to.height = maxHeight + "px";
            this.css.to.top = this.options.top + "px";
            this.css.from.top = this.options.fromTop + "px";
            this.node.setStyles({
                "height": maxHeight
            });
            this.contentHeight = maxHeight - offsetY;
            if (this.content) {
                this.content.setStyles({
                    "height" : maxHeight - offsetY,
                    "overflow-y": "auto"
                })
            }
        }else{
            this.options.height = y;
            this.options.contentHeight = null;
            this.options.fromTop = this.options.fromTop.toFloat() - offsetY / 2;
            this.options.top = this.options.top.toFloat() - offsetY / 2;
            this.css.to.height = y + "px";
            this.css.to.top = this.options.top + "px";
            this.css.from.top = this.options.fromTop + "px";
            this.node.setStyles({
                "height": y
            });
            this.contentHeight = y - offsetY;
            if (this.content) {
                this.content.setStyles({
                    "height" : y - offsetY,
                    "overflow-y": "hidden"
                })
            }
        }
    },
    getMaxHeight : function(){
        var maxHeightPercent;
        if( this.options.maxHeightPercent ){
            maxHeightPercent = this.options.maxHeightPercent;
            if( typeOf(maxHeightPercent) === "string" && maxHeightPercent.substr(maxHeightPercent.length - 1, 1) === "%" ) {
                var containerHeight = ( this.options.positionNode || this.options.container || $(document.body)).getSize().y;
                maxHeightPercent = parseInt(containerHeight * parseInt(maxHeightPercent) / 100);

                if( maxHeightPercent + (this.options.minTop || 0) > containerHeight ){
                    maxHeightPercent = containerHeight - (this.options.minTop)
                }
            }
        }

        var maxHeight;
        if( this.options.maxHeight && parseFloat( this.options.maxHeight ).toString() !== "NaN" ){
            maxHeight = parseFloat( this.options.maxHeight );
            if( typeOf(maxHeightPercent) === "number" ){
                maxHeight = Math.min( maxHeight, maxHeightPercent )
            }
        }else if( typeOf(maxHeightPercent) === "number" ){
            maxHeight = maxHeightPercent;
        }
        return maxHeight;
    },
    getNodeSize: function(){
        return {
            "height": this.nodeHeight+"px",
            "width": this.nodeWidth+"px"
        };
    },
    getContentSize: function(height, width){
        var nodeHeight, nodeWidth;
        if (!height){
            if (this.options.contentHeight){
                nodeHeight = height = this.options.contentHeight.toFloat();
                this.contentHeight = height;
            }else{
                height = this.options.height.toFloat();

                var maxHeight = this.getMaxHeight();
                if( typeOf(maxHeight) === "number" &&  maxHeight < height ){
                    height = maxHeight;
                }

                this.nodeHeight = height;
            }
        }else{
            this.nodeHeight = height;
        }
        if (!width){
            if (this.options.contentWidth){
                nodeWidth = width = this.options.contentWidth.toFloat();
                this.contentWidth = width;
            }else{
                width = this.options.width.toFloat();
                this.nodeWidth = width;
            }
        }else{
            this.nodeWidth = width;
        }

        var offsetHeight = 0;
        var offsetWidth = 0;
        if (this.title){
            var h1 = this.title.getSize().y;
            var ptop1 = this.title.getStyle("padding-top").toFloat();
            var pbottom1 = this.title.getStyle("padding-bottom").toFloat();
            var mtop1 = this.title.getStyle("margin-top").toFloat();
            var mbottom1 = this.title.getStyle("margin-bottom").toFloat();
            offsetHeight += h1 + ptop1 + pbottom1 + mtop1 + mbottom1;
        }
        if (this.bottom){
            var h2 = this.bottom.getSize().y;
            var ptop2 = this.bottom.getStyle("padding-top").toFloat();
            var pbottom2 = this.bottom.getStyle("padding-bottom").toFloat();
            var mtop2 = this.bottom.getStyle("margin-top").toFloat();
            var mbottom2 = this.bottom.getStyle("margin-bottom").toFloat();

            offsetHeight += h2 + ptop2 + pbottom2 + mtop2 + mbottom2;
        }
        if (this.button && !this.buttonDisable){
            var h3 = this.button.getSize().y;
            var ptop3 = this.button.getStyle("padding-top").toFloat();
            var pbottom3 = this.button.getStyle("padding-bottom").toFloat();
            var mtop3 = this.button.getStyle("margin-top").toFloat();
            var mbottom3 = this.button.getStyle("margin-bottom").toFloat();

            offsetHeight += h3 + ptop3 + pbottom3 + mtop3 + mbottom3;
        }

        var ptop4 = this.content.getStyle("padding-top").toFloat();
        var pbottom4 = this.content.getStyle("padding-bottom").toFloat();
        var mtop4 = this.content.getStyle("margin-top").toFloat();
        var mbottom4 = this.content.getStyle("margin-bottom").toFloat();
        offsetHeight += ptop4 + pbottom4 + mtop4 + mbottom4;

        if (nodeHeight){
            nodeHeight = nodeHeight + offsetHeight+2;
        }else {
            height = height - offsetHeight;
        }

        //if (this.content.getParent().getStyle("overflow-x")!="hidden" ) height = height-18;

        var pleft = this.content.getStyle("padding-left").toFloat();
        var pright = this.content.getStyle("padding-right").toFloat();
        var mleft = this.content.getStyle("margin-left").toFloat();
        var mright = this.content.getStyle("margin-right").toFloat();
        offsetWidth = pleft+pright+mleft+mright;
        //width = width-pleft-pright-mleft-mright;
        //if (this.content.getParent().getStyle("overflow-y")!="hidden" ) width = width-18;
        if (nodeWidth){
            nodeWidth = nodeWidth+offsetWidth;
        }else{
            width = width-offsetWidth;
        }


        if (nodeHeight) {
            this.nodeHeight = nodeHeight;
            this.options.height = nodeHeight;
            this.options.contentHeight = null;
            this.options.fromTop = this.options.fromTop.toFloat()-offsetHeight/2;
            this.options.top = this.options.top.toFloat()-offsetHeight/2;
            this.css.to.height = nodeHeight+"px";
            this.css.to.top = this.options.top+"px";
            this.css.from.top = this.options.fromTop+"px";
        }else{
            this.contentHeight = height;
        }

        if (nodeWidth){
            this.nodeWidth = nodeWidth;
            this.options.width = nodeWidth;
            this.options.contentWidth = null;
            this.options.fromLeft = this.options.fromLeft.toFloat()-offsetWidth/2;
            this.options.left = this.options.left.toFloat()-offsetWidth/2;
            this.css.to.width = nodeWidth+"px";
            this.css.to.left = this.options.left+"px";
            this.css.from.left = this.options.fromLeft+"px";
        }else{
            this.contentWidth = width;
        }

        if (!height || height<0){
            this.content.setStyles({"overflow": "hidden", "height": "auto", "width": ""+width+"px"});
            height = this.content.getSize().y;
            var h = height + h1 + ptop1 + pbottom1 + mtop1 + mbottom1;
            h = h + h2 + ptop2 + pbottom2 + mtop2 + mbottom2;
            h = h + h3 + ptop3 + pbottom3 + mtop3 + mbottom3;
            h = h + ptop4 + pbottom4 + mtop4 + mbottom4;
            this.css.to.height = h;
        }

//		var ptop5 = this.node.getStyle("padding-top").toFloat();
//		var pbottom5 = this.node.getStyle("padding-bottom").toFloat();
//		height = height - ptop5 - pbottom5;

        return {"height": height+"px", "width": width+"px"};
    },
    setContentHeight: function(height){
        var nodeHeight;
        if (!height){
            if (this.options.contentHeight){
                nodeHeight = height = this.options.contentHeight.toFloat();
                this.contentHeight = height;
            }else{
                height = this.options.height.toFloat();

                var maxHeight = this.getMaxHeight();
                if( typeOf(maxHeight) === "number" &&  maxHeight < height ){
                    height = maxHeight;
                }

                this.nodeHeight = height;
            }
        }else{
            this.nodeHeight = height;
        }

        var offsetHeight = 0;
        if (this.title){
            var h1 = this.title.getSize().y;
            //offsetHeight += h1 + this.getOffsetY(this.title);
            var ptop1 = this.title.getStyle("padding-top").toFloat();
            var pbottom1 = this.title.getStyle("padding-bottom").toFloat();
            var mtop1 = this.title.getStyle("margin-top").toFloat();
            var mbottom1 = this.title.getStyle("margin-bottom").toFloat();

            offsetHeight += h1 + ptop1 + pbottom1 + mtop1 + mbottom1;
        }
        if (this.bottom){
            var h2 = this.bottom.getSize().y;
            //offsetHeight += h2 + this.getOffsetY(this.bottom);
            var ptop2 = this.bottom.getStyle("padding-top").toFloat();
            var pbottom2 = this.bottom.getStyle("padding-bottom").toFloat();
            var mtop2 = this.bottom.getStyle("margin-top").toFloat();
            var mbottom2 = this.bottom.getStyle("margin-bottom").toFloat();

            offsetHeight += h2 + ptop2 + pbottom2 + mtop2 + mbottom2;
        }
        if (this.button && !this.buttonDisable){
            var h3 = this.button.getSize().y;
            //offsetHeight += h3 + this.getOffsetY(this.button);

            var ptop3 = this.button.getStyle("padding-top").toFloat();
            var pbottom3 = this.button.getStyle("padding-bottom").toFloat();
            var mtop3 = this.button.getStyle("margin-top").toFloat();
            var mbottom3 = this.button.getStyle("margin-bottom").toFloat();

            offsetHeight += h3 + ptop3 + pbottom3 + mtop3 + mbottom3;
        }

        //offsetHeight +=  this.getOffsetY(this.content);
        var ptop4 = this.content.getStyle("padding-top").toFloat();
        var pbottom4 = this.content.getStyle("padding-bottom").toFloat();
        var mtop4 = this.content.getStyle("margin-top").toFloat();
        var mbottom4 = this.content.getStyle("margin-bottom").toFloat();
        offsetHeight += ptop4 + pbottom4 + mtop4 + mbottom4;


        if (nodeHeight){
            nodeHeight = nodeHeight + offsetHeight+2;
        }else {
            height = height - offsetHeight;
        }

        if (nodeHeight) {
            this.nodeHeight = nodeHeight;
            this.options.height = nodeHeight;
            this.options.contentHeight = null;
            this.options.fromTop = this.options.fromTop.toFloat()-offsetHeight/2;
            this.options.top = this.options.top.toFloat()-offsetHeight/2;
            this.css.to.height = nodeHeight+"px";
            this.css.to.top = this.options.top+"px";
            this.css.from.top = this.options.fromTop+"px";
        }else{
            this.contentHeight = height;
        }
        //if (nodeWidth){
        //    this.nodeWidth = nodeWidth;
        //    this.options.width = nodeWidth;
        //    this.options.contentWidth = null;
        //    this.options.fromLeft = this.options.fromLeft.toFloat()-offsetWidth/2;
        //    this.options.left = this.options.left.toFloat()-offsetWidth/2;
        //    this.css.to.width = nodeWidth+"px";
        //    this.css.to.left = this.options.left+"px";
        //    this.css.from.left = this.options.fromLeft+"px";
        //}else{
        //    this.contentWidth = width;
        //}

        if (!height || height<0){
            this.content.setStyles({"overflow": "hidden", "height": "auto"});
            height = this.content.getSize().y;
            var h = height + h1 + ptop1 + pbottom1 + mtop1 + mbottom1;
            h = h + h2 + ptop2 + pbottom2 + mtop2 + mbottom2;
            h = h + h3 + ptop3 + pbottom3 + mtop3 + mbottom3;
            h = h + ptop4 + pbottom4 + mtop4 + mbottom4;
            this.css.to.height = h;
        }else{
            this.content.setStyles( {"height" : height} )
        }

    },
    setContentWidthAuto : function(){
        var maxWidth = this.options.maxWidth || "100%";
        if( typeOf(maxWidth) === "string" && maxWidth.substr(maxWidth.length - 1, 1) === "%" ) {
            var containerWidth = ( this.options.positionNode || this.options.container || $(document.body)).getSize().x;
            maxWidth = parseInt(containerWidth * parseInt(maxWidth) / 100);
        }

        var offsetX = 0;
        var x = 0;
        if( this.content ){
            offsetX = offsetX + this.getMarginX( this.content );
            x = offsetX + this.content.getSize().x;
        }else{
            x = offsetX;
        }


        if ( x > maxWidth) {
            this.nodeWidth = maxWidth;
            this.options.width = maxWidth;
            this.options.contentWidth = null;
            this.options.fromLeft = this.options.fromLeft.toFloat() - offsetX / 2;
            this.options.left = this.options.left.toFloat() - offsetX / 2;
            this.css.to.width = maxWidth + "px";
            this.css.to.left = this.options.left + "px";
            this.css.from.left = this.options.fromLeft + "px";
            this.node.setStyles({
                "width": maxWidth
            });

            this.contentWidth = maxWidth - this.getOffsetX(this.content);
            if (this.content) {
                this.content.setStyles({
                    "width" : this.contentWidth,
                    "overflow-x": "auto"
                })
            }
        }else{
            this.nodeWidth = x;
            this.options.width = x;
            this.options.contentHeight = null;
            this.options.fromLeft = this.options.fromLeft.toFloat() - offsetX / 2;
            this.options.left = this.options.left.toFloat() - offsetX / 2;
            this.css.to.width = x + "px";
            this.css.to.left = this.options.left + "px";
            this.css.from.left = this.options.fromLeft + "px";
            this.node.setStyles({
                "width": x
            });
            this.contentWidth = x - this.getOffsetX(this.content);
            if (this.content) {
                this.content.setStyles({
                    "width" : this.contentWidth,
                    "overflow-x": "hidden"
                })
            }
        }
    },
    setContentWidth: function(width){
        var nodeWidth;
        if (!width){
            if (this.options.contentWidth){
                nodeWidth = width = this.options.contentWidth.toFloat();
                this.contentWidth = width;
            }else{
                width = this.options.width.toFloat();
                this.nodeWidth = width;
            }
        }else{
            this.nodeWidth = width;
        }


        var offsetWidth = 0;

        //if (this.content.getParent().getStyle("overflow-x")!="hidden" ) height = height-18;

        var pleft = this.content.getStyle("padding-left").toFloat();
        var pright = this.content.getStyle("padding-right").toFloat();
        var mleft = this.content.getStyle("margin-left").toFloat();
        var mright = this.content.getStyle("margin-right").toFloat();
        offsetWidth = pleft+pright+mleft+mright;
        //width = width-pleft-pright-mleft-mright;
        //if (this.content.getParent().getStyle("overflow-y")!="hidden" ) width = width-18;
        if (nodeWidth){
            nodeWidth = nodeWidth+offsetWidth;
        }else{
            var x = width;
            width = width-offsetWidth;
        }

        if (nodeWidth){
            this.nodeWidth = nodeWidth;
            this.options.width = nodeWidth;
            this.options.contentWidth = null;
            this.css.to.left = this.options.left+"px";
            this.css.from.left = this.options.fromLeft+"px";
            this.css.to.width = nodeWidth+"px";
            this.options.fromLeft = this.options.fromLeft.toFloat()-offsetWidth/2;
            this.options.left = this.options.left.toFloat()-offsetWidth/2;
            this.node.setStyle("width", nodeWidth )
        }else{
            this.contentWidth = width;
            this.node.setStyle("width", x )
        }

        this.content.setStyles( {"width" : width} )

    },
    setContentSize: function(height, width){

        //this.content.setStyle("height", this.getContentSize(height));
        // if (!this.options.height && !height){
        //    this.content.setStyle("height", "auto");
        //    this.content.setStyle("overflow", "hidden");
        //    this.content.setStyle("width", "auto");
        // }else{
        var y = height;
        if (!y){
            if (this.options.contentHeight){
                y = this.options.contentHeight;
            }else{
                y = this.height;
            }
        }

        var x = width;
        if (!x){
            if (this.options.contentWidth){
                x = this.options.contentWidth;
            }else{
                x = this.width;
            }
        }
        if( y === "auto" || x === "auto" ){
            if( y === "auto" ){
                this.setContentHeightAuto();
            }else{
                this.setContentHeight( height );
            }
            if( x === "auto" ){
                this.setContentWidthAuto();
            }else{
                this.setContentWidth( width );
            }
        }else{
            this.content.setStyles(this.getContentSize(height, width));
            this.content.setStyle("width", "auto");
        }
    }
});
o2.DL.open = function(options){

    if (!options) options = {};
    if (!options.style) options.style = "user";
    //if (!options.transition) options.transition = Fx.Transitions.Back.easeOut;
    if (!options.duration) options.duration = 200;
    if (options.isClose!==false) options.isClose = true;

    var size;
    if ((!options.width || options.width=="auto") && !options.contentWidth){
        if (options.content){
            options.content.show();
            size = options.content.getComputedSize();
            options.contentWidth = size.totalWidth.toFloat();
        }
    }
    if ((!options.height || options.height=="auto") && !options.contentHeight){
        if (options.content){
            if (!size){
                options.content.show();
                size = options.content.getComputedSize();
            }
            options.contentHeight = size.totalHeight.toFloat()+2;
        }
    }
    if (!options.width && !options.contentWidth) options.width = 300;
    if (!options.height && !options.contentHeight) options.height = 150;

    if (!options.container && layout){
        if (layout.desktop.currentApp){
            options.container = layout.desktop.currentApp.content;
        }
    }
    var container = (options.positionNode || options.container || $(document.body));

    if( options.width !== "auto" && options.height !== "auto" ){

        //如果是百分比
        if( "string" == typeOf(options.width)  && (1 < options.width.length && "%" == options.width.substr(options.width.length - 1, 1)) ){
            options.width = parseInt( container.getSize().x * parseInt(options.width, 10) / 100, 10);
        }

        if( "string" == typeOf(options.height)  && (1 < options.height.length && "%" == options.height.substr(options.height.length - 1, 1)) ){
            options.height = parseInt( container.getSize().y * parseInt(options.height, 10) / 100, 10);
        }

        if ((options.top===undefined ) && (options.left===undefined)){
            var p = o2.getCenter({"x":(options.width || options.contentWidth), "y": (options.height || options.contentHeight+120)}, container, container);
            options.top = (p.y<0) ? 0 : p.y;
            options.left  = (p.x<0) ? 0 : p.x;
        }
        if ((options.fromTop===undefined ) && (options.fromLeft===undefined)){
            var p = o2.getCenter({"x":(options.width || options.contentWidth)*0, "y": (options.height || options.contentHeight+120)*0}, container, container);
            options.fromTop = (p.y<0) ? 0 : p.y;
            options.fromLeft  = (p.x<0) ? 0 : p.x;
        }
        if (options.offset){
            if (options.offset.y){
                options.top = options.top+options.offset.y.toInt();
                options.fromTop = options.fromTop+options.offset.y.toInt();
            }
            if (options.offset.x){
                options.left = options.left+options.offset.x.toInt();
                options.fromLeft = options.fromLeft+options.offset.x.toInt();
            }
        }
        if (options.top<0) options.top = 0;
        if (options.left<0) options.left = 0;
        if (options.fromTop<0) options.fromTop = 0;
        if (options.fromLeft<0) options.fromLeft = 0;
    }else{
        if(options.top===undefined )options.top = 0;
        if(options.left===undefined)options.left = 0;
        if(options.fromTop===undefined)options.fromTop = 0;
        if(options.fromLeft===undefined)options.fromLeft = 0;
    }


    options.mark = !(options.mask===false);

    var dlg = new o2.DDL(options);
    if( options.width === "auto" || options.height === "auto" ){
        dlg.addEvent("postShow", function(){this.reCenter()});

    }
    dlg.show();
    return dlg;
};

MWF.xDesktop = MWF.xDesktop || {};
MWF.require("MWF.widget.Menu", null, false);
MWF.xDesktop.Menu = new Class({
	Extends: MWF.widget.Menu,
	Implements: [Options, Events],
	options: {
		"style": "default",
		"event": "contextmenu",
		"disable": false,
		"top": -1,
		"left": -1,
        "container": null,
		"where": {"x": "left", "y": "bottom"}
	},
	load: function(){
		if (this.fireEvent("queryLoad")){
			this.node = new Element("div#menu");
			this.node.set("styles", this.css.container);
			
			if (this.options.event){
				if (this.target) this.target.addEvent(this.options.event, this.showIm.bind(this));
			}
			this.borderNode = new Element("div.MWFMenu", {
				"styles": this.css.borderNode
			}).inject(this.options.container || $(document.body));
			
			this.node.inject(this.borderNode);

			this.hide = this.hideMenu.bind(this);
			this.fireEvent("postLoad");
		}
	},
	showIm: function(e){
		if (!this.options.disable){
			this.hide = this.hideIm.bind(this);
			if (this.fireEvent("queryShow", [e])){
				this.tmpBodyOncontextmenu = document.body.oncontextmenu;
				document.body.oncontextmenu = function(){return false;};
				if (this.pauseCount<=0){
					this.setItemWidth();
					
					var i = MWF.xDesktop.zIndexPool ? MWF.xDesktop.zIndexPool.zIndex : 0;
					
					this.borderNode.setStyles({
						"display": "block",
						"opacity": this.options.opacity || 1,
						"z-index": i
					});
					
					this.setPosition(e);
					
					$(document.body).removeEvent("mousedown", this.hide);
					$(document.body).addEvent("mousedown", this.hide);
					
					this.show = true;
				}else{
					this.pauseCount--;
				}

				var p = this.node.getPosition(document.body);
				var size = this.node.getSize();
				var bodySize = document.body.getSize();
				if (p.y+size.y+10>bodySize.y){
					var y = bodySize.y-p.y-10;
					this.node.setStyle("height", ""+y+"px");
					this.node.addEvent("mousedown", function(e){ e.stopPropagation(); })
				}

				this.fireEvent("postShow");
			}
		}
	},
	hideIm: function(all){
		if (this.fireEvent("queryHide")){
			$(document.body).removeEvent("mousedown", this.hide);
			this.borderNode.set("styles", {
				"display": "none",
				"opacity": 0
			});
			this.show = false;
			document.body.oncontextmenu = this.tmpBodyOncontextmenu;
			this.tmpBodyOncontextmenu = null;
			
			if (all) if (this.topMenu) this.topMenu.hideIm();
			
			this.fireEvent("postHide");
		}
	},
	setPosition: function(e){
		var position = this.target.getPosition(this.target.getOffsetParent());
		var size = this.target.getSize();
        this.borderNode.show();
        var nodeSize = this.borderNode.getSize();

        var left=0, top=0;
        switch (this.options.where.x.toLowerCase()){
			case "right":
                left = position.x-nodeSize.x+size.x;
				break;
			default:
                left = position.x-0;
		}
        switch (this.options.where.y.toLowerCase()){
            case "top":
                top = position.y-nodeSize.y;
                break;
            default:
                top = position.y+size.y;
        }
		//(this.options.where)


		if (this.options.offsetY) top = top+this.options.offsetY;
		if (this.options.offsetX) left = left+this.options.offsetX;

        var bodySize = $(document.body).getSize();
        var borderSize = this.borderNode.getSize();
        if (left+borderSize.x>bodySize.x) left = bodySize.x-borderSize.x-10;
		
		this.borderNode.setStyle("top", top);
		this.borderNode.setStyle("left", left);
	}
});










MWF.xDesktop = MWF.xDesktop || {};
MWF.xApplication = MWF.xApplication || {};
MWF.require("MWF.xDesktop.Actions.RestActions", null, false);

MWF.xDesktop.UserData = MWF.UD = {
    getAction: function(){
        //this.action = new MWF.xDesktop.Actions.RestActions("/xDesktop/Actions/action.json", "x_organization_assemble_personal");
        this.action = o2.Actions.get("x_organization_assemble_personal");
    },
    getData: function(name, callback, async){
        if (!this.action) this.getAction();
        this.action.getUserData(name, function(json){
            if (callback) callback(json);
        }, null, async);
    },
    getDataJson: function(name, callback, async){
        if (!this.action) this.getAction();
        this.action.getUserData(name, function(json){
            var returnJson = null;
            if (json.data){
                try{
                    returnJson = JSON.decode(json.data);
                }catch(e){}
            }
            if (callback) callback(returnJson);
        }, null, async);
    },

    putData: function(name, data, callback, async){
        if (!this.action) this.getAction();
        this.action.putUserData(name, data, function(json){
            if (callback) callback(json);
        }, null, async)

        // this.action.invoke({"name": "putUserData", "async": async, "data": data, "parameter": {"name": name}, "success": function(json){
        //     if (callback) callback(json);
        // }.bind(this)});
    },
    deleteData: function(name, callback, async){
        if (!this.action) this.getAction();
        this.action.deleteUserData(name, function(json){
            if (callback) callback(json);
        }, null, async)

        // this.action.invoke({"name": "deleteUserData", "async": async, "parameter": {"name": name}, "success": function(json){
        //     if (callback) callback(json);
        // }.bind(this)});
    },

    getPublicData: function(name, callback, async){
        if (!this.action) this.getAction();
        this.action.getPublicUserData(name, function(json){
            var returnJson = null;
            if (json.data){
                try{
                    returnJson = JSON.decode(json.data);
                }catch(e){}
            }
            if (callback) callback(returnJson);
        }, null, async)

        // this.action.invoke({"name": "getPublicUserData", "async": async, "parameter": {"name": name}, "success": function(json){
        //     var returnJson = null;
        //     if (json.data) returnJson = JSON.decode(json.data);
        //     if (callback) callback(returnJson);
        // }.bind(this)});
    },
    putPublicData: function(name, data, callback, async){
        if (!this.action) this.getAction();

        this.action.putPublicUserData(name, data, function(json){
            if (callback){
                if (callback.success){
                    callback.success(json);
                }else{
                    callback(json);
                }
            }
        }, function(xhr, text, error){
            if (xhr.status!=0){
                var errorText = error;
                if (xhr){
                    var json = JSON.decode(xhr.responseText);
                    if (json){
                        errorText = json.message.trim() || "request json error";
                    }else{
                        errorText = "request json error: "+xhr.responseText;
                    }
                }
                MWF.xDesktop.notice("error", {x: "right", y:"top"}, errorText);
            }
            if (callback) if (callback.failure) callback.failure(xhr, text, error);
        }, async);

        // this.action.invoke({"name": "putPublicUserData", "async": async, "data": data, "parameter": {"name": name}, "success": function(json){
        //     if (callback){
        //         if (callback.success){
        //             callback.success(json);
        //         }else{
        //             callback(json);
        //         }
        //     }
        // }.bind(this), "failure": function(xhr, text, error){
        //     if (xhr.status!=0){
        //         var errorText = error;
        //         if (xhr){
        //             var json = JSON.decode(xhr.responseText);
        //             if (json){
        //                 errorText = json.message.trim() || "request json error";
        //             }else{
        //                 errorText = "request json error: "+xhr.responseText;
        //             }
        //         }
        //         MWF.xDesktop.notice("error", {x: "right", y:"top"}, errorText);
        //     }
        //     if (callback) if (callback.failure) callback.failure(xhr, text, error);
        // }});
    },
    deletePublicData: function(name, callback, async){
        if (!this.action) this.getAction();
        this.action.deletePublicUserData(name, function(json){
            if (callback) callback(json);
        }, null, async);

        // this.action.invoke({"name": "deletePublicUserData", "async": async, "parameter": {"name": name}, "success": function(json){
        //     if (callback) callback(json);
        // }.bind(this)});
    }
};

MWF.xApplication.Template = MWF.xApplication.Template || {};
//MWF.xDesktop.requireApp("Template", "lp." + MWF.language, null, false);
MWF.xApplication.Template.MPopupForm = MPopupForm = new Class({
    Extends: MWF.widget.Common,
    Implements: [Options, Events],
    options: {
        "style": "default",
        "width": 500,
        "height": 450,
        "top": null,
        "left": null,
        "bottom" : null,
        "right" : null,
        "minWidth" : 300,
        "minHeight" : 220,

        "isLimitSize": true,
        "ifFade": true,
        "hasTop": false,
        "hasTopIcon" : false,
        "hasTopContent" : false,
        "hasIcon": true,
        "hasMask" : true,
        "closeByClickMask" : false,
        "hasScroll" : true,
        "scrollType" : "",

        "title": "",
        "draggable": false,
        "resizeable" : false,
        "maxAction" : false,
        "closeAction": true,
        "okClass": "",
        "topClass": "",

        "relativeToApp" : true,
        "sizeRelateTo" : "app", //desktop
        "resultSeparator" : ",",

        "hasBottom": true,
        "hideBottomWhenReading": false,
        "closeByClickMaskWhenReading" : false,
        "buttonList" : [{ "type":"cancel", "text": "" },{ "type":"ok", "text": "" }]
    },
    initialize: function (explorer, data, options, para) {
        this.setOptions(options);
        this.explorer = explorer;
        if( para ){
            if( this.options.relativeToApp ){
                this.app = para.app || this.explorer.app;
                this.container = para.container || this.app.content;
                this.lp = para.lp || this.explorer.lp || this.app.lp;
                this.css = para.css || this.explorer.css || this.app.css;
                this.actions = para.actions || this.explorer.actions || this.app.actions || this.app.restActions;
            }else{
                this.container = para.container;
                this.lp = para.lp || this.explorer.lp;
                this.css = para.css || this.explorer.css;
                this.actions = para.actions || this.explorer.actions;
            }
        }else{
            if( this.options.relativeToApp ){
                this.app = this.explorer.app;
                this.container = this.app.content;
                this.lp = this.explorer.lp || this.app.lp;
                this.css = this.explorer.css || this.app.css;
                this.actions = this.explorer.actions || this.app.actions || this.app.restActions;
            }else{
                this.container = window.document.body;
                this.lp = this.explorer.lp;
                this.css = this.explorer.css;
                this.actions = this.explorer.actions;
            }
        }
        this.data = data || {};

        this.cssPath = "../x_component_Template/$MPopupForm/"+this.options.style+"/css.wcss";

        this.load();
    },
    load: function () {
        this._loadCss();
    },
    _loadCss: function(reload){
        var css = {};
        var key = encodeURIComponent(this.cssPath);
        if (!reload && o2.widget.css[key]){
            css = Object.clone(o2.widget.css[key]);
        }else{
            var r = new Request.JSON({
                url: o2.filterUrl(this.cssPath),
                secure: false,
                async: false,
                method: "get",
                noCache: false,
                onSuccess: function(responseJSON, responseText){
                    o2.widget.css[key] = responseJSON;
                    css = Object.clone(responseJSON);
                }.bind(this),
                onError: function(text, error){
                    alert(error + text);
                }
            });
            r.send();
       }

        var isEmptyObject = true;
        for( var key in css ){
            if(key){
                isEmptyObject = false;
                break;
            }
        }
        if( !isEmptyObject ){
            this.css = Object.merge(  css, this.css || {});
        }else if( !this.css ){
            this.css = {};
        }
    },
    reload : function( keepData ){
        if( keepData ){
            this.data = this.form.getResult(false, this.options.resultSeparator, false, false, true);
        }
        this.formTopNode = null;
        if(this.setFormNodeSizeFun && this.app && this.app.removeEvent){
            this.app.removeEvent("resize",this.setFormNodeSizeFun);
        }
        if( this.formMaskNode )this.formMaskNode.destroy();
        if( this.formAreaNode )this.formAreaNode.destroy();
        if( this.isNew ){
            this.create();
        }else if( this.isEdited ){
            this.edit();
        }else{
            this.open();
        }
    },
    open: function (e) {
        this.fireEvent("queryOpen");
        this.isNew = false;
        this.isEdited = false;
        this._open();
        this.fireEvent("postOpen");
    },
    create: function () {
        this.fireEvent("queryCreate");
        this.isNew = true;
        this._open();
        this.fireEvent("postCreate");
    },
    edit: function () {
        this.fireEvent("queryEdit");
        this.isEdited = true;
        this._open();
        this.fireEvent("postEdit");
    },
    _open: function () {
        debugger;

        this.fireEvent("queryLoad");
        if(this._queryLoad)this._queryLoad();

        if( this.options.hasMask ){
            this.formMaskNode = new Element("div.formMaskNode", {
                "styles": this.css.formMaskNode,
                "events": {
                    "mouseover": function (e) {
                        e.stopPropagation();
                    },
                    "mouseout": function (e) {
                        e.stopPropagation();
                    },
                    "click": function (e) {
                        e.stopPropagation();
                    },
                    "mousewheel": function (e) {
                        if (e.stopPropagation) e.stopPropagation();
                        else e.cancelBubble = true;

                        if (e.preventDefault) e.preventDefault();
                        else e.returnValue = false;
                    },
                    "DOMMouseScroll": function (e) {
                        if (e.stopPropagation) e.stopPropagation();
                        else e.cancelBubble = true;

                        if (e.preventDefault) e.preventDefault();
                        else e.returnValue = false;
                    }
                }
            }).inject( this.container || this.app.content);
        }

        this.formAreaNode = new Element("div.formAreaNode", {
            "styles": this.css.formAreaNode
        });
        if(layout.mobile && this.css.invisible){
            this.formAreaNode.setStyles(this.css.invisible);
        }

        this.createFormNode();

        if( this.formMaskNode ){
            this.formAreaNode.inject(this.formMaskNode , "after");
        }else{
            this.formAreaNode.inject( this.container || this.app.content );
        }

        this.setFormNodeSize();
        this.setFormNodeSizeFun = this.setFormNodeSize.bind(this);
        if( this.app && this.app.addEvent )this.app.addEvent("resize", this.setFormNodeSizeFun);

        if(layout.mobile && this.css.visible){
            this.formAreaNode.setStyles(this.css.visible);
        }else if (this.options.ifFade){
            this.formAreaNode.fade("in");
        }else{
            this.formAreaNode.setStyle("opacity", 1);
        }

        if (this.options.draggable && this.formTopNode) {
            var size = (this.container || this.app.content).getSize();
            var nodeSize = this.formAreaNode.getSize();
            this.formAreaNode.makeDraggable({
                "handle": this.formTopNode,
                "limit": {
                    "x": [0, size.x - nodeSize.x],
                    "y": [0, size.y - nodeSize.y]
                },
                "onDrag": function(){
                    this.fireEvent("drag");
                }.bind(this),
                "onComplete": function(){
                    this.fireEvent("dragCompleted");
                }.bind(this)
            });
        }

        if( ( this.options.closeByClickMask || (!this.isNew && !this.isEdited && this.options.closeByClickMaskWhenReading) ) && this.formMaskNode ){
            this.formMaskNode.addEvent("click", function(e){
                this.close(e)
            }.bind(this));
        }

        if (this.options.resizeable){
            this.resizeNode = new Element("div.resizeNode", {
                "styles": this.css.resizeNode
            }).inject(this.formNode);
            this.formAreaNode.makeResizable({
                "handle": this.resizeNode,
                "limit": {x:[ this.options.minWidth, null], y:[this.options.minHeight, null]},
                "onDrag": function(){
                    var size = this.formAreaNode.getComputedSize();
                    this.setNodesSize( size.width, size.height );
                    this.fireEvent("resize");
                }.bind(this),
                "onComplete": function(){
                    var size = this.formAreaNode.getComputedSize();
                    this.options.width = size.width;
                    this.options.height = size.height;
                    if( this.oldCoordinate ){
                        this.oldCoordinate.width = size.width;
                        this.oldCoordinate.height = size.height;
                    }
                    this.fireEvent("resizeCompleted");
                    this.fireEvent("afterResize");
                }.bind(this)
            });
        }

        if(this._postLoad)this._postLoad();
        this.fireEvent("postLoad");

    },
    createFormNode: function () {
        var _self = this;

        this.formNode = new Element("div.formNode", {
            "styles": this.css.formNode
        }).inject(this.formAreaNode);

        if (this.options.hasTop) {
            this.createTopNode();
        }

        if (this.options.hasIcon) {
            this.formIconNode = new Element("div.formIconNode", {
                "styles": this.isNew ? this.css.formNewNode : this.css.formIconNode
            }).inject(this.formNode);
        }

        this.createContent();
        //formContentNode.set("html", html);

        if (this.options.hasBottom && (this.isNew || this.isEdited || !this.options.hideBottomWhenReading) ) {
            this.createBottomNode();
        }

        this._setCustom();

        if( this.options.hasScroll ){
            //this.setScrollBar(this.formTableContainer)
            if( this.options.scrollType == "window" ){
                this.formContentNode.setStyle("overflow","auto");
                this.formTableContainer.setStyle("overflow","visible");
            }else{
                MWF.require("MWF.widget.ScrollBar", function () {
                    new MWF.widget.ScrollBar(this.formTableContainer, {
                        "indent": false,
                        "style": "xApp_TaskList",
                        "where": "before",
                        "distance": 30,
                        "friction": 4,
                        "axis": {"x": false, "y": true},
                        "onScroll": function (y) {
                            //var scrollSize = _self.viewContainerNode.getScrollSize();
                            //var clientSize = _self.viewContainerNode.getSize();
                            //var scrollHeight = scrollSize.y - clientSize.y;
                            //if (y + 200 > scrollHeight && _self.view && _self.view.loadElementList) {
                            //    if (!_self.view.isItemsLoaded) _self.view.loadElementList();
                            //}
                        }
                    });
                }.bind(this));
            }
        }
    },
    _setCustom : function(){

    },
    createTopNode: function () {

        this.fireEvent("queryCreateTop");
        if (!this.formTopNode) {
            this.formTopNode = new Element("div.formTopNode", {
                "styles": this.css.formTopNode
            }).inject(this.formNode);
            if( this.options.topClass ){
                this.formTopNode.addClass( this.options.topClass );
            }

            if(this.options.hasTopIcon){
                this.formTopIconNode = new Element("div", {
                    "styles": this.css.formTopIconNode
                }).inject(this.formTopNode)
            }

            this.formTopTextNode = new Element("div", {
                "styles": this.css.formTopTextNode,
                "text": this.options.title
            }).inject(this.formTopNode);

            if (this.options.closeAction) {
                this.formTopCloseActionNode = new Element("div", {
                    "styles": this.css.formTopCloseActionNode,
                    "title" : MWF.xApplication.Template.LP.MPopupForm.close
                }).inject(this.formTopNode);
                this.formTopCloseActionNode.addEvent("click", function ( ev ) {
                    this.close();
                    ev.stopPropagation();
                }.bind(this))
            }

            if( this.options.maxAction ){
                this.formTopMaxActionNode = new Element("div", {
                    "styles": this.css.formTopMaxActionNode,
                    "title" : MWF.xApplication.Template.LP.MPopupForm.max
                }).inject(this.formTopNode);
                this.formTopMaxActionNode.addEvent("click", function () {
                    this.maxSize()
                }.bind(this));

                this.formTopRestoreActionNode = new Element("div", {
                    "styles": this.css.formTopRestoreActionNode,
                    "title": MWF.xApplication.Template.LP.MPopupForm.restore
                }).inject(this.formTopNode);
                this.formTopRestoreActionNode.addEvent("click", function () {
                    this.restoreSize()
                }.bind(this));

                this.formTopNode.addEvent("dblclick", function(){
                    this.switchMax();
                }.bind(this));
            }

            if(this.options.hasTopContent){
                this.formTopContentNode = new Element("div.formTopContentNode", {
                    "styles": this.css.formTopContentNode
                }).inject(this.formTopNode);

                this._createTopContent();
            }

        }

        this.fireEvent("postCreateTop");

        //if (!this.formTopNode) {
        //    this.formTopNode = new Element("div.formTopNode", {
        //        "styles": this.css.formTopNode,
        //        "text": this.options.title
        //    }).inject(this.formNode);
        //
        //    this._createTopContent();
        //
        //    if (this.options.closeAction) {
        //        this.formTopCloseActionNode = new Element("div.formTopCloseActionNode", {"styles": this.css.formTopCloseActionNode}).inject(this.formTopNode);
        //        this.formTopCloseActionNode.addEvent("click", function () {
        //            this.close()
        //        }.bind(this))
        //    }
        //}
    },
    _createTopContent: function () {

    },
    createContent: function () {
        this.formContentNode = new Element("div.formContentNode", {
            "styles": this.css.formContentNode
        }).inject(this.formNode);

        this.formTableContainer = new Element("div.formTableContainer", {
            "styles": this.css.formTableContainer
        }).inject(this.formContentNode);

        this.formTableArea = new Element("div.formTableArea", {
            "styles": this.css.formTableArea
        }).inject(this.formTableContainer);


        this._createTableContent();
    },
    _createTableContent: function () {

        var html = "<table width='100%' bordr='0' cellpadding='5' cellspacing='0' styles='formTable'>" +
                //"<tr><td colspan='2' styles='formTableHead'>申诉处理单</td></tr>" +
            "<tr><td styles='formTableTitle' lable='empName'></td>" +
            "    <td styles='formTableValue' item='empName'></td></tr>" +
            "<tr><td styles='formTableTitle' lable='departmentName'></td>" +
            "    <td styles='formTableValue' item='departmentName'></td></tr>" +
            "<tr><td styles='formTableTitle' lable='recordDateString'></td>" +
            "    <td styles='formTableValue' item='recordDateString'></td></tr>" +
            "<tr><td styles='formTableTitle' lable='status'></td>" +
            "    <td styles='formTableValue' item='status'></td></tr>" +
            "<tr><td styles='formTableTitle' lable='appealReason'></td>" +
            "    <td styles='formTableValue' item='appealReason'></td></tr>" +
            "<tr><td styles='formTableTitle' lable='appealDescription'></td>" +
            "    <td styles='formTableValue' item='appealDescription'></td></tr>" +
            "<tr><td styles='formTableTitle' lable='opinion1'></td>" +
            "    <td styles='formTableValue' item='opinion1'></td></tr>" +
            "</table>";
        this.formTableArea.set("html", html);

        MWF.xDesktop.requireApp("Template", "MForm", function () {
            this.form = new MForm(this.formTableArea, {empName: "xadmin"}, {
                isEdited: this.isEdited || this.isNew,
                itemTemplate: {
                    empName: {text: "姓名", type: "innertext"},
                    departmentName: {text: "部门", tType: "department", notEmpty: true},
                    recordDateString: {text: "日期", tType: "date"},
                    status: {text: "状态", tType: "number"},
                    appealReason: {
                        text: "下拉框",
                        type: "select",
                        selectValue: ["测试1", "测试2"]
                    },
                    appealDescription: {text: "描述", type: "textarea"},
                    opinion1: {text: "测试", type: "button", "value": "测试"}
                }
            }, this.app);
            this.form.load();
        }.bind(this), true);
    },
    createBottomNode: function () {
        this.fireEvent("queryCreateBottom");
        this.formBottomNode = new Element("div.formBottomNode", {
            "styles": this.css.formBottomNode
        }).inject(this.formNode);

        this._createBottomContent();
        this.fireEvent("postCreateBottom");
    },
    _createBottomContent: function () {

        if( !this.options.buttonList ){
            this._createCancelActionNode();
            this._createOkActionNode();
        }else{
            debugger;
            this.options.buttonList.each(function (button) {
                if(button.type === "cancel"){
                    this._createCancelActionNode( button.text || "" );
                }else if( button.type === "ok" ){
                    this._createOkActionNode( button.text || "" );
                }else{

                }
            }.bind(this))
        }
    },
    _createCancelActionNode: function(text){
        this.cancelActionNode = new Element("div.formCancelActionNode", {
            "styles": this.css.formCancelActionNode,
            "text": text || this.lp.cancel
        }).inject(this.formBottomNode);
        this.cancelActionNode.addEvent("click", function (e) {
            this.cancel(e);
        }.bind(this));
    },
    _createOkActionNode: function(text){
        if (this.isNew || this.isEdited) {
            this.okActionNode = new Element("div.formOkActionNode", {
                "styles": this.css.formOkActionNode,
                "text": text || this.lp.ok
            }).inject(this.formBottomNode);

            if( this.options.okClass ){
                this.okActionNode.addClass( this.options.okClass );
            }

            this.okActionNode.addEvent("click", function (e) {
                this.ok(e);
            }.bind(this));
        }
    },
    formatMobileButton: function (node, container) {
        const setButtonStyle = (button)=>{
            if( button.tagName === 'button' || button.tagName === 'oo-button' ){
                button.setStyles(this.css.popupAction);
            }else{
                const bs = button.querySelectorAll("button, oo-button");
                bs.forEach(b=>b.setStyles(this.css.popupAction));
            }
        }
        const visibleButtons = node.getChildren().filter(function (button) {
            return button.getStyle("display") !== "none";
        });
        if( visibleButtons.length === 1 ){
            setButtonStyle(visibleButtons[0]);
        }else if( visibleButtons.length > 2 ){

            var maskNode;
            new Element("div.moreActionNode", {
                text: '…',
                styles: this.css.moreActionNode,
                events: {
                    click: function (e) {
                        if( !moreArea.offsetParent ){
                            maskNode = new Element("div.moreMaskNode", {
                                styles: this.css.moreActionMask,
                                events: {
                                    click: function (e) {
                                        moreArea.setStyle('display', 'none');
                                        maskNode?.destroy();
                                    }
                                }
                            }).inject(moreArea, 'before');
                        }else if(!!maskNode){
                            maskNode.destroy();
                        }
                        moreArea.setStyle('display', moreArea.offsetParent ? 'none' : 'flex');
                    }.bind(this)
                }
            }).inject(node);
            const moreArea = new Element("div.moreActionArea", {
                styles: this.css.moreActionArea
            }).inject(container || document.body);
            visibleButtons.forEach(function (button, i) {
                if( i > 1 ){
                    button.inject(moreArea);
                    setButtonStyle(button);
                }
            }.bind(this));

        }
    },
    cancel: function (e) {
        this.fireEvent("queryCancel");
        this.close();
        this.fireEvent("postCancel");
    },
    close: function (e) {
        this.fireEvent("queryClose");
        this._close();
        //if( this.form ){
        //    this.form.destroy();
        //}
        if(this.setFormNodeSizeFun && this.app && this.app.removeEvent ){
            this.app.removeEvent("resize",this.setFormNodeSizeFun);
        }
        if( this.formMaskNode )this.formMaskNode.destroy();
        if( this.formAreaNode )this.formAreaNode.destroy();
        this.fireEvent("postClose");
        delete this;
    },
    _close: function(){

    },
    ok: function (e) {
        this.fireEvent("queryOk");
        var data = this.form.getResult(true, this.options.resultSeparator, true, false, true);
        if (data) {
            this._ok(data, function (json) {
                if (json.type == "error") {
                    if( this.app && this.app.notice )this.app.notice(json.message, "error");
                } else {
                    if( this.formMaskNode )this.formMaskNode.destroy();
                    if( this.formAreaNode )this.formAreaNode.destroy();
                    if (this.explorer && this.explorer.view)this.explorer.view.reload();
                    if( this.app && this.app.notice)this.app.notice(this.isNew ? this.lp.createSuccess : this.lp.updateSuccess, "success");
                    this.fireEvent("postOk");
                }
            }.bind(this))
        }
    },
    _ok: function (data, callback) {
        //this.app.restActions.saveDocument( this.data.id, data, function(json){
        //    if( callback )callback(json);
        //}.bind(this), function( errorObj ){
        //    var error = JSON.parse( errorObj.responseText );
        //    this.app.notice( error.message, error );
        //}.bind(this));
    },
    switchMax : function(){
        if( !this.isMax ){
            this.maxSize();
        }else{
            this.restoreSize();
        }
    },
    maxSize: function(){
        if(!this.oldCoordinate)this.oldCoordinate = {
            width : this.options.width,
            height : this.options.height,
            top : this.options.top,
            left : this.options.left,
            bottom : this.options.bottom,
            right : this.options.right
        };
        this.options.width = "100%";
        this.options.height = "100%";
        this.options.top = null;
        this.options.left = null;
        this.options.bottom = null;
        this.options.right = null;
        this.setFormNodeSize();
        this.formTopMaxActionNode.setStyle("display","none");
        this.formTopRestoreActionNode.setStyle("display","");
        this.isMax = true;
        this.fireEvent("max");
        this.fireEvent("afterResize");
    },
    restoreSize : function(){
        if( this.oldCoordinate){
            this.options.width = this.oldCoordinate.width;
            this.options.height = this.oldCoordinate.height;
            this.options.top = this.oldCoordinate.top;
            this.options.left = this.oldCoordinate.left;
            this.options.bottom = this.oldCoordinate.bottom;
            this.options.right = this.oldCoordinate.right;
        }
        this.setFormNodeSize();
        this.formTopMaxActionNode.setStyle("display","");
        this.formTopRestoreActionNode.setStyle("display","none");
        this.isMax = false;
        this.fireEvent("restore");
        this.fireEvent("afterResize");
    },
    resetHeight: function( height, offset ){
        var h;
        if( height === "auto" ){
            var tableHeight = this.formTableArea.getSize().y;
            var tableContainerOffsetY = this.getOffsetY( this.formTableContainer );
            var formContentOffsetY = this.getOffsetY( this.formContentNode );
            var formTopHeight = this.formTopNode ? ( this.formTopNode.getSize().y + this.getOffsetY(this.formTopNode) ) : 0;
            var formBottomHeight = this.formBottomNode ? ( this.formBottomNode.getSize().y + this.getOffsetY(this.formBottomNode) ) : 0;
            h = tableHeight + tableContainerOffsetY + formContentOffsetY + formTopHeight + formBottomHeight + (offset || 0);
        }else{
            h = height + (offset || 0);
        }
        this.options.height = h;
        if( this.isMax )return;
        var s = this.lastStyle || {};
        this.setFormNodeSize(null, h, s.top, s.left );
        this.fireEvent("afterResize");
    },
    setSize: function(width, height){
        debugger;
        if( width )this.options.width = width;
        if( height )this.options.height = height;
        this.setFormNodeSize(width, height);
        this.fireEvent("afterResize");
    },
    setFormNodeSize: function (width, height, top, left, bottom, right) {

        this._beforeFormNodeSize();

        if (!width)width = this.options.width ? this.options.width : "50%";
        if (!height)height = this.options.height ? this.options.height : "50%";
        if (!top && top != 0 ) top = this.options.top; // ? this.options.top : 0;
        if (!left && left != 0) left = this.options.left; // ? this.options.left : 0;
        if (!bottom && bottom != 0) bottom = this.options.bottom; // ? this.options.bottom : 0;
        if (!right && right != 0) right = this.options.right; // ? this.options.right : 0;

        width = width.toString();
        height = height.toString();

        var allSize = ( this.container || this.app.content).getSize();
        var limitWidth = allSize.x; //window.screen.width
        var limitHeight = allSize.y; //window.screen.height

        if (this.options.isLimitSize){
            if( "%" != width.substr(width.length - 1, 1) ){
                if( allSize.x < parseInt(width) )width = allSize.x;
            }
            if( "%" != height.substr(height.length - 1, 1) ){
                if( allSize.y < parseInt(height) )height = allSize.y;
            }
        }

        //if( width != "auto" ){
            "string" == typeof width && (1 < width.length && "%" == width.substr(width.length - 1, 1)) && (width = parseInt(limitWidth * parseInt(width, 10) / 100, 10));
            this.options.minWidth > width && (width = this.options.minWidth);
        //}
        //if( height != "auto" ){
            "string" == typeof height && (1 < height.length && "%" == height.substr(height.length - 1, 1)) && (height = parseInt(limitHeight * parseInt(height, 10) / 100, 10));
            this.options.minHeight > height && (height = this.options.minHeight);
        //}

        var styles = {
            "width": "" + width + "px",
            "height": "" + height + "px"
        };

        if( top != null ){
            styles.top = "" + top + "px";
            styles.bottom = "auto";
        }else if( bottom != null ){
            styles.top = "auto";
            styles.bottom = "" + bottom + "px";
        }else{
            styles.top = "" + parseInt((limitHeight - height) / 2, 10) + "px";
            styles.bottom = "auto";
        }

        if( left != null ){
            styles.left = "" + left + "px";
            styles.right = "auto";
        }else if( right != null ){
            styles.left = "auto";
            styles.right = "" + right + "px";
        }else{
            styles.left = "" + parseInt((limitWidth - width) / 2, 10) + "px";
            styles.right = "auto";
        }

        this.lastStyle = styles;

        if( this.formAreaNode )this.formAreaNode.setStyles(styles);

        this._setFormNodeSize(styles);

        this.setNodesSize( width, height );
    },
    _beforeFormNodeSize : function(){

    },
    _setFormNodeSize: function( styles ){

    },
    setNodesSize: function(width, height){
        //if( height == "auto" )return;
        this.options.minWidth > width && (width = this.options.minWidth);
        this.options.minHeight > height && (height = this.options.minHeight);

        this.formNode.setStyles({
            "width": "" + width + "px",
            "height": "" + height + "px"
        });

        var iconSize = this.formIconNode ? this.formIconNode.getSize() : {x: 0, y: 0};
        var topSize = this.formTopNode ? this.formTopNode.getSize() : {x: 0, y: 0};
        var bottomSize = this.formBottomNode ? this.formBottomNode.getSize() : {x: 0, y: 0};

        var contentHeight = height - iconSize.y - topSize.y - bottomSize.y;
        var marginTop = parseFloat(this.formContentNode.getStyle( "margin-top" )) || 0;
        var marginBottom = parseFloat(this.formContentNode.getStyle( "margin-bottom" )) || 0;
        var formContentHeight = contentHeight - marginTop - marginBottom;
        this.formContentNode.setStyles({
            "height": "" + formContentHeight + "px"
        });

        var paddingTop = parseFloat( this.formContentNode.getStyle( "padding-top" )) || 0;
        var paddingBottom = parseFloat( this.formContentNode.getStyle( "padding-bottom" )) || 0;
        marginTop = parseFloat( this.formTableContainer.getStyle( "margin-top" )) || 0;
        marginBottom = parseFloat( this.formTableContainer.getStyle( "margin-bottom" )) || 0;
        var tablePaddingTop = parseFloat( this.formTableContainer.getStyle( "padding-top" )) || 0;
        var tablePaddingTBottom = parseFloat( this.formTableContainer.getStyle( "padding-bottom" )) || 0;
        var formTableHeight = contentHeight - marginTop - marginBottom - paddingTop - paddingBottom - tablePaddingTop - tablePaddingTBottom;

        if( this.options.scrollType == "window" ){
            formTableHeight = formTableHeight - 10;
        }

        this.formTableContainer.setStyles({
            "height": "" + formTableHeight + "px"
        });
        this._setNodesSize( width, height, formContentHeight, formTableHeight );
        this.fireEvent("resizeForm");
    },
    _setNodesSize : function(width, height, formContentHeight, formTableHeight ){

    },
    getOffsetY : function(node){
        return (node.getStyle("margin-top").toInt() || 0 ) +
            (node.getStyle("margin-bottom").toInt() || 0 ) +
            (node.getStyle("padding-top").toInt() || 0 ) +
            (node.getStyle("padding-bottom").toInt() || 0 )+
            (node.getStyle("border-top-width").toInt() || 0 ) +
            (node.getStyle("border-bottom-width").toInt() || 0 );
    },
    getOffsetX : function(node){
        return (node.getStyle("margin-left").toInt() || 0 ) +
            (node.getStyle("margin-right").toInt() || 0 ) +
            (node.getStyle("padding-left").toInt() || 0 ) +
            (node.getStyle("padding-right").toInt() || 0 )+
            (node.getStyle("border-left-width").toInt() || 0 ) +
            (node.getStyle("border-right-width").toInt() || 0 );
    }
});

MWF.xDesktop = MWF.xDesktop || {};
MWF.xApplication = MWF.xApplication || {};
MWF.xDesktop.requireApp("Template", "MPopupForm", null, false);
MWF.require("MWF.xDesktop.UserData", null, false);

MWF.xDesktop.Authentication = new Class({
    Extends: MWF.widget.Common,
    Implements: [Options, Events],
    options: {
        "style": "flat",
        // "width": "650",
        // "height": "480"
        "width": "420",
        "height": "640",
        "popupStyle_password": "o2platformSignupFlat",
        "popupStyle_signup": "o2platformSignup"
    },
    initialize: function (options, app, node) {
        this.setOptions(options);
        this.node = node;
        this.path = MWF.defaultPath + "/xDesktop/$Authentication/";

        // var css = null;
        // MWF.UD.getPublicData("loginStyleList", function (json) {
        //     if (json && json.enabledId) {
        //         MWF.UD.getPublicData(json.enabledId, function (json) {
        //             if (json && json.data) {
        //                 css = json.data;
        //             }
        //         }.bind(this), false);
        //     }
        // }.bind(this), false);

        // if (!css) {
            this.cssPath = MWF.defaultPath + "/xDesktop/$Authentication/" + this.options.style + "/css.wcss";
            this._loadCss();
        // } else {
        //     this.css = css;
        // }

        this.lp = MWF.LP.authentication;
        this.app = app || {};
    },
    isAuthenticated: function (success, failure) {
        MWF.Actions.get("x_organization_assemble_authentication").getAuthentication(success, failure);
    },

    loadLogin: function (node) {
        o2.Actions.load("x_organization_assemble_authentication").EchoAction.get(function () {
            if (node) this.loginNode = node;
            if (!node && this.loginNode) node = this.loginNode;
            if (layout.config.loginPage && layout.config.loginPage.enable && layout.config.loginPage.portal) {
                o2.Actions.load('x_portal_assemble_surface').PortalAction.get(layout.config.loginPage.portal, function (){
                    MWF.xDesktop.loadPortal(layout.config.loginPage.portal, this.options.loginParameter, true);
                    this.fireEvent("openLogin");
                }.bind(this), function () {
                    this._loagDefaultLogin(node);
                    return true;
                }.bind(this))
            } else {
                this._loagDefaultLogin(node);
            }
        }.bind(this), function (xhr) {
            var message;
            if (xhr) {
                try {
                    var responseJSON = JSON.parse(xhr.responseText);
                    message = responseJSON.message; //message为错误提示文本
                } catch (e) {
                }
            }
            if (!message) message = MWF.LP.authentication.accessError;
            new Element("div", {
                "style": "font-size:16px;font-weight:bold;",
                "text": message
            }).inject(node);
        }.bind(this));
    },
    _loagDefaultLogin: function (node) {
        this.popupOptions = {
            "draggable": false,
            "closeAction": false,
            "hasMask": false,
            "relativeToApp": false
        };
        this.popupPara = {
            container: node
        };
        this.postLogin = function (json) {
            layout.desktop.session.user = json.data;
            layout.session.user = json.data;
            layout.session.token = layout.session.user.token;
            var user = layout.desktop.session.user;
            if (!user.identityList) user.identityList = [];
            if (user.roleList) {
                var userRoleName = [];
                user.roleList.each(function (role) {
                    userRoleName.push(role.substring(0, role.indexOf("@")));
                });
                user.roleList = user.roleList.concat(userRoleName);
            }
            var roleLCList = (user.roleList || []).map(function (role) {
                return role.toLowerCase();
            }.bind(this));

            var uri = new URI(window.location.toString());
            var redirect = uri.getData("redirect");

            if (redirect){
                window.location = redirect;
            }else{
                if (roleLCList.isIntersect(["systemmanager", "securitymanager", "auditmanager"])) {
                    window.location = "../x_desktop/app.html?app=ThreeMember";
                } else {
                    window.location.reload();
                }
            }

        }.bind(this);
        this.openLoginForm(this.popupOptions);
        this.fireEvent("openLogin");
    },
    safeLogout: function(){
        o2.Actions.get("x_organization_assemble_authentication").safeLogout(function () {
            if (this.socket) {
                this.socket.close();
                this.socket = null;
            }
            if (layout.session && layout.session.user) layout.session.user.token = "";
            if (sessionStorage) sessionStorage.removeItem("o2LayoutSessionToken");
            window.location.reload();
        }.bind(this));
    },
    logout: function ( callback ) {
        MWF.Actions.get("x_organization_assemble_authentication").logout(function () {
            if (this.socket) {
                this.socket.close();
                this.socket = null;
            }
            if (layout.session && layout.session.user) layout.session.user.token = "";
            if (sessionStorage) sessionStorage.removeItem("o2LayoutSessionToken");
            if( callback ){
                callback();
            }else{
                window.location.reload();
            }
        }.bind(this));
    },
    openLoginForm: function (options, callback) {
        var opt = Object.merge(this.popupOptions || {}, options || {}, {
            onPostOk: function (json) {
                if (callback) callback(json);
                if (this.postLogin) this.postLogin(json);
                this.fireEvent("postOk", json)
            }.bind(this)
        });
        opt.width = this.options.width;
        opt.height = this.options.height;
        var form = new MWF.xDesktop.Authentication.LoginForm(this, {}, opt, this.popupPara);
        form.create();
    },
    openSignUpForm: function (options, callback) {
        var opt = Object.merge(this.popupOptions || {}, options || {}, {
            onPostOk: function (json) {
                if (callback) callback(json);
                this.fireEvent("postOk", json)
            }.bind(this)
        });
        delete opt.width;
        delete opt.height;
        if (this.options.popupStyle_signup) opt.popupStyle = this.options.popupStyle_signup;
        var form = new MWF.xDesktop.Authentication.SignUpForm(this, {}, opt, this.popupPara);
        form.create();
    },
    openResetPasswordForm: function (options, callback) {
        var opt = Object.merge(this.popupOptions || {}, options || {}, {
            onPostOk: function (json) {
                if (callback) callback(json);
                this.fireEvent("postOk", json)
            }.bind(this)
        });
        if (this.options.popupStyle_password) opt.popupStyle = this.options.popupStyle_password;
        // delete opt.width;
        // delete opt.height;
        var form = new MWF.xDesktop.Authentication.ResetPasswordForm(this, {}, opt, this.popupPara);
        form.create();
    },
    openChangePasswordForm: function (options, callback) {
        //options 里应该包括 userName
        var opt = Object.merge(this.popupOptions || {}, options || {}, {
            onPostOk: function (json) {
                if (callback) callback(json);
                this.fireEvent("postOk", json)
            }.bind(this)
        });
        // if (this.options.popupStyle_password) opt.popupStyle = this.options.popupStyle_password;
        var form = new MWF.xDesktop.Authentication.ChangePasswordForm(this, {}, opt, this.popupPara);
        form.create();
    }

});

MWF.xDesktop.Authentication.LoginForm = new Class({
    Extends: MPopupForm,
    Implements: [Options, Events],
    options: {
        "style": "default",
        "popupStyle": "o2platform",
        "width": "650",
        "height": "480",
        "hasTop": true,
        "hasIcon": false,
        "hasTopIcon": true,
        "hasTopContent": true,
        "hasBottom": false,
        "hasScroll": false,
        "hasMark": false,
        "title": "",
        "draggable": true,
        "closeAction": true
    },
    load: function () {
        this.setOptions({
            "title": (layout.config && (layout.config.systemTitle || layout.config.title)) ? (layout.config.title || layout.config.systemTitle) : MWF.LP.authentication.LoginFormTitle
        });
        this._loadCss();
    },
    //Camera Login
    _createTopContent: function () {
        this.actions = MWF.Actions.get("x_organization_assemble_authentication");

        this.faceLogin = false;
        // this.actions.getLoginMode(function (json) {
        //     this.faceLogin = json.data.faceLogin;
        // }.bind(this), null, false);
        //
        // if (this.faceLogin) {
        //     if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        //         COMMON.AjaxModule.loadDom("../o2_lib/adapter/adapter.js", function () {
        //             if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        //                 //暂时隐藏此功能
        //                 this.cameraLoginIcon = new Element("div", { "styles": this.explorer.css.cameraLoginIcon }).inject(this.formTopContentNode);
        //                 this.cameraLoginIcon.addEvent("click", function () {
        //                     if (!this.isCameraLogin) {
        //                         this.cameraLogin();
        //                         this.isCameraLogin = true;
        //                     } else {
        //                         this.closeCamera();
        //                         this.isCameraLogin = false;
        //                     }
        //                 }.bind(this));
        //             }
        //         }.bind(this));
        //     }
        // }
    },
    closeCamera: function () {
        if (this.cameraLoginVideoNode) {
            if (this.video) this.video.destroy();
            if (this.canvas) this.canvas.destroy();
            if (this.cameraLoginVideoNode) this.cameraLoginVideoNode.destroy();
            this.video = null;
            this.canvas = null;
            this.cameraLoginVideoNode = null;
        }
        this.cameraLoginIcon.setStyles(this.explorer.css.cameraLoginIcon);
    },
    cameraLoginInit: function () {
        this.cameraLoginConfig = {
            "maxStep": 2,
            "step": 0,
            "count": 0,
            "max": 2,
            "errorCount": 0,
            "errorMax": 3,
            "user": "",
            "tokens": []
        };
    },
    cameraLoginReset: function (resetError) {
        this.cameraLoginConfig.count = 0;
        this.cameraLoginConfig.user = "";
        if (resetError) this.cameraLoginConfig.errorCount = 0;
    },
    cameraLogin: function () {
        this.cameraLoginInit();
        this.cameraLoginIcon.setStyles(this.explorer.css.closeCameraLoginIcon);
        this.createCameraLoginNode();
        this.startCameraLogin();
    },
    createCameraLoginNode: function () {
        this.cameraLoginVideoNode = new Element("div", { "styles": this.explorer.css.cameraLoginVideoNode }).inject(this.container);
        var size = this.formNode.getSize();
        var topSize = this.formTopNode.getSize();
        var h = size.y - topSize.y;
        this.cameraLoginVideoNode.setStyles({
            "width": "" + size.x + "px",
            "height": "" + h + "px"
        });
        this.cameraLoginVideoNode.position({
            "relativeTo": this.formContentNode,
            "position": "upperLeft",
            "edge": "upperLeft"
        });
    },
    startCameraLogin: function () {
        this.cameraLoginVideoAreaNode = new Element("div").inject(this.cameraLoginVideoNode);
        this.cameraLoginVideoInfoNode = new Element("div", { "styles": this.explorer.css.cameraLoginVideoInfoNode }).inject(this.cameraLoginVideoNode);
        this.cameraLoginVideoInfoNode.set("text", MWF.LP.desktop.login.camera_logining);
        var size = this.cameraLoginVideoNode.getSize();
        var infoSize = this.cameraLoginVideoInfoNode.getSize();
        var h = size.y - infoSize.y;
        this.cameraLoginVideoAreaNode.setStyle("height", "" + h + "px");

        this.cameraLoginVideoAreaNode.set("html", "<video autoplay></video>");
        this.video = this.cameraLoginVideoAreaNode.getFirst().setStyles({
            "background-color": "#000000",
            "width": "" + size.x + "px",
            "height": "" + h + "px"
        });
        this.videoStart();
    },
    videoStart: function () {
        this.video.addEventListener("canplay", function () {
            window.setTimeout(function () {
                this.startCameraAuthentication();
            }.bind(this), 500);
        }.bind(this));

        navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true
        }).then(function (stream) {
            this.video.srcObject = stream;
        }.bind(this))["catch"](function (error) {
            console.log('navigator.getUserMedia error: ', error);
            this.closeCamera();
        }.bind(this));
    },
    getFormData: function () {
        if (!this.canvas) {
            this.canvas = new Element("canvas", { "styles": { "display": "none" } }).inject(this.cameraLoginVideoNode);
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
        }
        this.canvas.getContext('2d').drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

        var blob = this.toBlob(this.canvas.toDataURL());
        var formData = new FormData();
        formData.append('file', blob);

        this.canvas.destroy();
        return { "data": formData, "size": blob.size };
    },
    //检测出身份
    checkUserFace: function (formData) {

        var faceset = window.location.host;
        faceset = faceset.replace(/\./g, "_");
        this.faceAction.search(faceset, formData.data, { "name": "pic", "size": formData.size }, function (json) {
            if (json.data.results && json.data.results.length) {
                var hold = json.data.thresholds["1e-5"];
                if (json.data.results[0].confidence > hold) {
                    var token = json.data.faces[0].face_token;
                    var user = json.data.results[0].user_id;
                    if ((!this.cameraLoginConfig.user) || (this.cameraLoginConfig.user === user)) {
                        this.cameraLoginConfig.count++;
                        this.cameraLoginConfig.user = user;
                        this.cameraLoginConfig.tokens.push(token);
                        this.cameraLoginConfig.step++;
                        this.cameraLoginConfig.errorCount = 0;
                        this.cameraLoginVideoInfoNode.set("text", MWF.LP.desktop.login["camera_logining_" + this.cameraLoginConfig.step]);
                    } else {
                        this.cameraLoginReset();
                        this.cameraLoginConfig.errorCount++;
                    }
                } else {
                    this.cameraLoginReset();
                    this.cameraLoginConfig.errorCount++;
                }
            } else {
                this.cameraLoginReset();
                this.cameraLoginConfig.errorCount++;
            }
            this.checkCameraLogin();
        }.bind(this), function () {
            window.setTimeout(function () { this.startCameraAuthentication(); }.bind(this), 500);
        }.bind(this));
    },
    checkUserAlive: function (formData, attr, method) {
        this.faceAction.detectattr(attr, formData.data, { "name": "pic", "size": formData.size }, function (json) {
            if (json.data.faces && json.data.faces.length) {
                if (this[method](json.data.faces[0].attributes)) {
                    this.cameraLoginConfig.step++;
                    this.cameraLoginConfig.errorCount = 0;
                    this.cameraLoginVideoInfoNode.set("text", MWF.LP.desktop.login["camera_logining_" + this.cameraLoginConfig.step]);
                } else {
                    //可能是照片
                    this.cameraLoginConfig.errorCount++;
                }
            } else {
                this.cameraLoginConfig.errorCount++;
            }
            this.checkCameraLogin();
        }.bind(this), function () {
            this.cameraLoginConfig.errorCount++;
            this.checkCameraLogin();
        }.bind(this));
    },
    //检测微笑
    checkUserSmile: function (attr) {
        return attr.smile.value > attr.smile.threshold;
    },
    //检测抬头
    checkUserPitch: function (attr) {
        return attr.headpose.pitch_angle < -10;
    },
    startCameraAuthentication: function () {
        if (this.video) {
            var formData = this.getFormData();
            if (!this.faceAction) this.faceAction = MWF.Actions.get("x_faceset_control");

            if (this.cameraLoginConfig.step === 0) {
                this.checkUserFace(formData);
            }
            if (this.cameraLoginConfig.step === 1) {
                this.checkUserAlive(formData, "smiling", "checkUserSmile");
            }
            if (this.cameraLoginConfig.step === 2) {
                this.checkUserAlive(formData, "headpose", "checkUserPitch");
            }
        }
    },

    toBlob: function (base64) {
        var bytes;
        if (base64.substr(0, 10) === 'data:image') {
            bytes = window.atob(base64.split(',')[1]);
        } else {
            bytes = window.atob(base64);
        }
        var ab = new ArrayBuffer(bytes.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < bytes.length; i++) {
            ia[i] = bytes.charCodeAt(i);
        }
        return new Blob([ab], { type: "image/png" });
    },
    getDIF: function (arr) {
        var max = Math.max.apply(this, arr);
        var min = Math.min.apply(this, arr);
        return max - min;
    },
    checkCameraLogin: function () {

        if (this.cameraLoginConfig.errorCount > this.cameraLoginConfig.errorMax) {
            this.cameraLoginVideoInfoNode.set("text", MWF.LP.desktop.login.camera_loginError);
        } else {
            if (this.cameraLoginConfig.step >= this.cameraLoginConfig.maxStep) {
                var text = MWF.LP.desktop.login.camera_loginSuccess.replace("{name}", this.cameraLoginConfig.user);
                this.cameraLoginVideoInfoNode.set("text", text);
                this.cameraLoginSuccess();
            } else {
                window.setTimeout(function () { this.startCameraAuthentication(); }.bind(this), 100);
            }
        }
    },

    cameraLoginSuccess: function () {
        COMMON.AjaxModule.loadDom(["../o2_lib/CryptoJS/tripledes.js", "../o2_lib/CryptoJS/mode-ecb.js"], function () {
            //COMMON.AjaxModule.loadDom(, function(){

            var addressObj = layout.serviceAddressList["x_organization_assemble_authentication"];
            var defaultPort = layout.config.app_protocol==='https' ? "443" : "80";
            var appPort = addressObj.port || window.location.port;
            var url = layout.config.app_protocol + "//" + (addressObj.host || window.location.hostname)+ ((!appPort || appPort.toString()===defaultPort) ? "" : ":"+appPort) + addressObj.context;

            var code = this.crypDES();
            var json = { "client": "face", "token": code };
            var _self = this;
            var res = new Request.JSON({
                "method": "POST",
                "url": o2.filterUrl(url + "/jaxrs/sso"),
                "data": JSON.stringify(json),
                secure: false,
                emulation: false,
                noCache: true,
                withCredentials: true,
                "headers": {
                    "Content-Type": "application/json; charset=utf-8"
                },
                onSuccess: function (responseJSON) {
                    _self._close();
                    _self.closeCamera();
                    if (_self.formMaskNode) _self.formMaskNode.destroy();
                    _self.formAreaNode.destroy();
                    var xToken = this.getHeader(o2.tokenName);
                    if (layout.config && layout.config.sessionStorageEnable) sessionStorage.setItem("o2LayoutSessionToken", xToken);
                    if (_self.explorer && _self.explorer.view) _self.explorer.view.reload();
                    if (_self.app) _self.app.notice(_self.lp.loginSuccess, "success");
                    _self.fireEvent("postOk", responseJSON);
                },
                onError: function () {
                    this.cameraLoginVideoInfoNode.set("text", MWF.LP.desktop.login.camera_loginError2);
                }.bind(this)
            });
            res.send();

            //}.bind(this));
        }.bind(this));
    },

    crypDES: function () {
        var key = "xplatform";
        var userId = this.cameraLoginConfig.user;
        var d = (new Date()).getTime();

        var keyHex = CryptoJS.enc.Utf8.parse(key);

        var xtoken = CryptoJS.DES.encrypt(userId + "#" + d, keyHex, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        });
        var str = xtoken.ciphertext.toString(CryptoJS.enc.Base64);
        str = str.replace(/=/g, "");
        str = str.replace(/\+/g, "-");
        str = str.replace(/\//g, "_");
        return str;
    },
    _createTableContent: function (){

        this.loginType = "captcha";
        this.userPwdLogin = true;
        this.codeLogin = false;
        this.bindLogin = false;
        this.captchaLogin = true;
        this.twoFactorLogin = false;

        var p1 = this.actions.getLoginMode(function (json) {
            // this.userPwdLogin = json.data.userPwdLogin !== false;
            this.codeLogin = json.data.codeLogin;
            this.bindLogin = json.data.bindLogin;
            this.captchaLogin = json.data.captchaLogin;
            this.twoFactorLogin = json.data.twoFactorLogin;
            if( this.codeLogin && this.twoFactorLogin ){ //如果两个都是true，以短信登录为准
                this.twoFactorLogin = false;
            }
        }.bind(this));

        this.oauthList = [];
        var p2 = this.actions.listOauthServer(function (json) {
            this.oauthList = json.data || [];
        }.bind(this));

        var p3 = MWF.Actions.get("x_organization_assemble_personal").getRegisterMode(function (json) {
            this.signUpMode = json.data.value;
        }.bind(this));

        Promise.all([p1, p2, p3]).then(function (){
            this.noOauth = this.oauthList.length < 1;
            this._loadLoginContent();
        }.bind(this));
    },
    _loadLoginContent: function () {
        if( this.formTopTextNode && this.formTopCloseActionNode ){
            this.formTopCloseActionNode.inject( this.formTopTextNode, "before" )
        }

        if( this.bindLogin ){
            this.bindLoginTipPic = new Element("div.bindLoginTipPic", { styles: this.css.bindLoginTipPic }).inject(this.formContentNode, "top");
            this.bindLoginAction = new Element("div.bindLoginAction", { styles: this.css.bindLoginAction }).inject(this.formContentNode, "top");
            this.bindLoginAction.addEvent("click", function () {
                this.showBindCodeLogin();
            }.bind(this));

            this.backtoPasswordLoginTipPic = new Element("div.backtoPasswordLoginTipPic", { styles: this.css.backtoPasswordLoginTipPic }).inject(this.formContentNode, "top");
            this.backtoPasswordLoginAction = new Element("div.backtoPasswordLoginAction", { styles: this.css.backtoPasswordLoginAction }).inject(this.formContentNode, "top");
            this.backtoPasswordLoginAction.addEvent("click", function () {
                this.backtoPasswordLogin();
            }.bind(this));
        }

        var html = this._getContentHtml();
        this.formTableArea.set("html", html);

        new Element("div", {
            "styles": this.css.formFooter,
            // "styles": {
            //     "text-align": "center",
            //     "height": "40px",
            //     "line-height": "40px"
            // },
            "text": layout.config.footer || layout.config.systemName
        }).inject(this.formTableArea, "after");


        if (this.captchaLogin) this.setCaptchaPic();
        this.errorArea = this.formTableArea.getElement("[item=errorArea]");

        this.oauthArea = this.formTableArea.getElement("[item=oauthArea]");

        MWF.xDesktop.requireApp("Template", "MForm", function () {

            var uri = new URI(window.location.toString());
            var userName = uri.getData("username");

            this.form = new MForm(this.formTableArea, this.data, {
                style: this.options.popupStyle,
                verifyType: "single",	//batch一起校验，或alert弹出
                isEdited: this.isEdited || this.isNew,
                itemTemplate: {
                    credential: {
                        attr: {readonly: (!!userName)},
                        text: userName || this.lp.userName,
                        value: userName || '',
                        defaultValue: this.lp.userName,
                        className: "inputUser",
                        notEmpty: true,
                        defaultValueAsEmpty: true,
                        emptyTip: this.lp.inputYourUserName,
                        event: {
                            focus: function (it) {
                                if (this.lp.userName === it.getValue()) it.setValue("");
                                if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputActive);
                            }.bind(this),
                            blur: function (it) {
                                if ("" === it.getValue()) it.setValue(this.lp.userName);
                                if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputUser);
                            }.bind(this),
                            keyup: function (it, ev) {
                                if (ev.event.keyCode === 13) this.ok();
                            }.bind(this)
                        },
                        onEmpty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputEmpty);
                        }.bind(this),
                        onUnempty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputUser);
                        }.bind(this)
                    },
                    password: {
                        text: this.lp.password,
                        type: "password",
                        defaultValue: "password",
                        className: "inputPassword",
                        notEmpty: true,
                        defaultValueAsEmpty: true,
                        emptyTip: this.lp.inputYourPassword,
                        event: {
                            focus: function (it) {
                                if ("password" === it.getValue()) it.setValue("");
                                if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputActive);
                            }.bind(this),
                            blur: function (it) {
                                if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputPassword);
                            }.bind(this),
                            keyup: function (it, ev) {
                                if (ev.event.keyCode === 13) this.ok();
                            }.bind(this)
                        },
                        onEmpty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputEmpty);
                        }.bind(this),
                        onUnempty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputPassword);
                        }.bind(this)
                    },
                    captchaAnswer: {
                        tType: "number",
                        text: this.lp.verificationCode,
                        defaultValue: this.lp.verificationCode,
                        className: "inputVerificationCode",
                        notEmpty: true,
                        defaultValueAsEmpty: true,
                        emptyTip: this.lp.inputPicVerificationCode,
                        event: {
                            focus: function (it) {
                                if (this.lp.verificationCode === it.getValue()) it.setValue("");
                                if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputActive);
                            }.bind(this),
                            blur: function (it) {
                                if ("" === it.getValue()) it.setValue(this.lp.verificationCode);
                                if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputVerificationCode);
                            }.bind(this),
                            keyup: function (it, ev) {
                                if (ev.event.keyCode === 13) this.ok();
                            }.bind(this)
                        },
                        onEmpty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputEmpty);
                        }.bind(this),
                        onUnempty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputVerificationCode);
                        }.bind(this)
                    },
                    changeCaptchaAction: {
                        value: this.lp.changeVerification,
                        type: "innerText",
                        className: "verificationChange",
                        event: {
                            click: function () {
                                this.setCaptchaPic();
                            }.bind(this)
                        }
                    },
                    codeAnswer: {
                        text: this.lp.verificationCode,
                        defaultValue: this.lp.inputVerificationCode,
                        className: "inputVerificationCode2",
                        notEmpty: true,
                        defaultValueAsEmpty: true,
                        emptyTip: this.lp.inputVerificationCode,
                        event: {
                            focus: function (it) {
                                if (this.lp.inputVerificationCode === it.getValue()) it.setValue("");
                                if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputActive);
                            }.bind(this),
                            blur: function (it) {
                                if ("" === it.getValue()) it.setValue(this.lp.inputVerificationCode);
                                if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputVerificationCode2);
                            }.bind(this),
                            keyup: function (it, ev) {
                                if (ev.event.keyCode === 13) this.ok();
                            }.bind(this)
                        },
                        onEmpty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputEmpty);
                        }.bind(this),
                        onUnempty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputVerificationCode2);
                        }.bind(this)
                    },
                    codeAnswerWithTwoFactorlogin: {
                        text: this.lp.verificationCode,
                        defaultValue: this.lp.inputVerificationCode,
                        className: "inputVerificationCode3",
                        notEmpty: false,
                        defaultValueAsEmpty: true,
                        emptyTip: this.lp.inputVerificationCode,
                        event: {
                            focus: function (it) {
                                if (this.lp.inputVerificationCode === it.getValue()) it.setValue("");
                                if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputActive);
                            }.bind(this),
                            blur: function (it) {
                                if ("" === it.getValue()) it.setValue(this.lp.inputVerificationCode);
                                if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputVerificationCode3);
                            }.bind(this),
                            keyup: function (it, ev) {
                                if (ev.event.keyCode === 13) this.doTwoFactorlogin();
                            }.bind(this)
                        },
                        onEmpty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputEmpty);
                        }.bind(this),
                        onUnempty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputVerificationCode2);
                        }.bind(this)
                    },
                    verificationAction: {
                        value: this.lp.sendVerification,
                        type: "button",
                        className: "inputSendVerification",
                        event: {
                            click: function () {
                                this.sendVerificationAction();
                            }.bind(this)
                        }
                    },
                    resendVerificationAction: {
                        value: this.lp.resendVerification,
                        type: "button",
                        className: "inputResendVerification"
                    },
                    loginAction: {
                        value: this.twoFactorLogin ? this.lp.sendVerification : this.lp.loginAction,
                        type: "button",
                        className: "inputLogin",
                        event: {
                            click: function () {
                                this.ok();
                            }.bind(this)
                        }
                    },
                    twoFactorloginStep2Action: {
                        value: this.lp.loginAction,
                        type: "button",
                        className: "inputLogin",
                        event: {
                            click: function () {
                                this.doTwoFactorlogin();
                            }.bind(this)
                        }
                    },
                    passwordAction: {
                        value: this.lp.passwordLogin,
                        type: "innerText",
                        className: "titleNode_active",
                        event: {
                            click: function () {
                                if (this.codeLogin) this.showPasswordLogin();
                            }.bind(this)
                        }
                    },
                    codeAction: {
                        value: this.lp.codeLogin,
                        type: "innerText",
                        className: "titleNode_normal",
                        event: {
                            click: function () {
                                this.showCodeLogin();
                            }.bind(this)
                        }
                    },
                    signUpAction: {
                        value: this.lp.signUp,
                        type: "innerText",
                        className: "signUpAction",
                        event: {
                            click: function () {
                                this.gotoSignup();
                            }.bind(this)
                        }
                    },
                    forgetPassword: {
                        value: this.lp.forgetPassword,
                        type: "innerText",
                        className: "forgetPassword",
                        event: {
                            click: function () {
                                this.gotoResetPassword();
                            }.bind(this)
                        }
                    },
                    hideTwoFactorySendMsgAction: {
                        value: this.lp.return,
                        type: "innerText",
                        className: "forgetPassword",
                        event: {
                            click: function () {
                                this.hideTwoFactorySendMsgArea();
                            }.bind(this)
                        }
                    }
                }
            }, this.app, this.css);
            this.form.load();

            // if( !this.userPwdLogin && this.codeLogin ){
            //     this.showCodeLogin();
            // }

        }.bind(this), true);

        if (this.bindLogin) {
            this.bindLoginContainer = new Element("div", {
                styles: this.css.bindLoginContainer
            }).inject(this.formContentNode);

            var html2 = "<div item='bindLoginTitle' styles='bindTitleNode'></div>" +
                "<div styles='bindBodyArea'>" +
                "<div item='bindPicArea' styles='bindPicArea'></div>" +
                "<div styles='bindSepArea'></div>" +
                "<div styles='bindExampleArea'></div>" +
                "</div>" +
                "<div styles='bindTipArea'>" +
                "   <div styles='bindTipIconArea'></div>" +
                "   <div styles='bindTipTextArea'>" +
                "       " + this.lp.userAppCameraHtml +
                "       <div>"+this.lp.loginToPage +"</div>" +
                "</div>" +
                "<div styles='bindErrorArea'></div>";

            this.bindLoginContainer.set("html", html2);

            this.isShowEnable = true;
            this.bindBodyArea = this.bindLoginContainer.getElement("[styles='bindBodyArea']");
            this.bindLoginContainer.addEvent("mousemove", function (ev) {
                if (this.bindBodyArea.isOutside(ev)) {
                    this.hideExampleArea(ev);
                } else {
                    this.showExampleArea(ev);
                }
            }.bind(this));

            this.bindPicArea = this.bindLoginContainer.getElement("[item='bindPicArea']");
            this.setBindPic();
            this.bindExampleArea = this.bindLoginContainer.getElement("[styles='bindExampleArea']");
            this.bindSepArea = this.bindLoginContainer.getElement("[styles='bindSepArea']");
            var link = this.bindLoginContainer.getElement("[styles='bindTipLinkArea']");
            link.addEvent("click", function () {
                if( layout.config.appUrl ){
                    window.open(layout.config.appUrl, "_blank");
                }else{
                    window.open(this.lp.o2downloadLink, "_blank");
                }
            }.bind(this));
            this.bindErrorArea = this.bindLoginContainer.getElement("[styles='bindErrorArea']");

            MWF.xDesktop.requireApp("Template", "MForm", function () {
                this.bindform = new MForm(this.bindLoginContainer, {}, {
                    style: "o2platform",
                    verifyType: "single",	//batch一起校验，或alert弹出
                    isEdited: this.isEdited || this.isNew,
                    itemTemplate: {
                        bindLoginTitle: { value: this.lp.bingLoginTitle, type: "innerText" }
                    }
                }, this.app, this.css);
                this.bindform.load();

                //如果只有二维码登录
                // if(this.disableUserLogin){
                //     this.showBindCodeLogin();
                // }
            }.bind(this), true);
        }

        this.loadOauthContent();

    },
    _getContentHtml: function () {
        var html = "";

        html += "<table width='100%' bordr='0' cellpadding='0' cellspacing='0' styles='formTable'>";
        html += " <tr>";
        html += "<div item='passwordAction'></div>";
        this.codeLogin && (html += "<div styles='titleSep'></div>");
        this.codeLogin && (html += "<div item='codeAction'></div>");
        html += " </tr>";
        html += "</table>";

        html += "<table width='100%' bordr='0' cellpadding='0' cellspacing='0' styles='formTable'>";

        html += "<tr item='credentialTr'>" +
            "   <td styles='formTableValueTop20'>" +
            "       <div style='position: relative;'><div item='credential'></div><div class='inputUserIcon'></div></div>" +
            "   </td>" +
            "</tr>";

        html += "<tr item='passwordTr'>" +
            "   <td styles='formTableValueTop20'>" +
            "       <div style='position: relative;'><div item='password'></div><div class='inputPasswordIcon'></div></div>" +
            "   </td>" +
            "</tr>";

        if (this.captchaLogin) {
            html += "<tr item='captchaTr'><td styles='formTableValueTop20'>" +
                "<div style='float:left;'>" +
                "       <div style='position: relative;'><div item='captchaAnswer'></div><div class='inputVerificationCodeIcon'></div></div>" +
                "</div>" +
                "<div item='captchaPic' style='float:left;padding-left:5px'></div>" +
                "<div item='changeCaptchaAction' style='float:left;'></div>" +
                "</td></tr>";
        }

        if (this.codeLogin) {
            html += "<tr item='codeTr' style='display: none'><td styles='formTableValueTop20'>" +
                "   <div style='float:left;'>" +
                "       <div style='position: relative;'>" +
                "           <div item='codeAnswer'></div>" +
                "           <div class='inputVerificationCode2Icon'></div>" +
                "       </div>" +
                "   </div>" +
                "   <div item='verificationAction' style='float:left;'></div>" +
                "   <div item='resendVerificationAction' style='float:left;display:none;'></div>" +
                "</td></tr>";
        }else if(this.twoFactorLogin){
            html += "<tr item='codeTr' style='display: none'><td styles='formTableValueTop60'>" +
                "   <div style='float:left;'>"+
                "       <div style='position: relative;'>" +
                "           <div item='codeAnswerWithTwoFactorlogin'></div>" +
                "           <div class='inputVerificationCode3Icon'></div>" +
                "       </div>" +
                "   </div>" +
                "</td></tr>";
            html += "<tr item='twoFactorloginStep2Tr' style='display: none'>" +
                "   <td styles='formTableValueTop20' item='twoFactorloginStep2Action'></td>" +
                "</tr>";
        }
        html += "<tr item='loginActionTr'><td styles='formTableValueTop20' item='loginAction'></td></tr>";
        html +=  "</table>";
        html += "<table width='100%' bordr='0' cellpadding='0' cellspacing='0' styles='formTable'>";
        if (this.signUpMode && this.signUpMode !== "disable") {
            html += "<tr item='forgetPasswordTr'><td>" +
                "   <div item='signUpAction'></div>" +
                "   <div item='forgetPassword'></div>" +
                "</td></tr>";
        } else {
            html += "<tr item='forgetPasswordTr'><td>" +
                "   <div styles='signUpAction'></div>" +
                "   <div item='forgetPassword'></div>" +
                "</td></tr>";
        }
        if(this.twoFactorLogin){
            html += "<tr item='hideTwoFactorySendMsgTr' style='display: none'><td>" +
                "   <div styles='signUpAction'></div>" +
                "   <div item='hideTwoFactorySendMsgAction'></div>" +
                "</td></tr>";
        }
        html += "<tr><td styles='formTableValue' item='errorArea'></td></tr>" +
            "<tr><td styles='formTableValue' item='oauthArea'></td></tr>" +
            "</table>";
        return html;
    },
    _beforeFormNodeSize: function () {
        if (!this.isPlusOauthSize && this.oauthListNode) {
            this.options.height = parseInt(this.options.height) + this.oauthArea.getSize().y;
            this.isPlusOauthSize = true;
        }
        if (this.oauthListNode || (!this.captchaLogin && !this.bindLogin)) { //留高度给二维码
            this.options.height = this.options.height - 60;
        }
        if (this.oauthListNode && this.captchaLogin) {
            this.options.height = this.options.height + 60;
        }
    },
    loadOauthContent: function () {
        if (this.oauthList.length > 0) {
            if (!this.oauthArea.getChildren().length) {
                this.oauthListNode = new Element("div", { styles: this.css.oauthListNode }).inject(this.oauthArea);
            }
            this.oauthList.each(function (d) {
                if (d.displayName === "@O2企业微信") {
                    d.qywx = true;
                } else if (d.displayName === "@O2钉钉") {
                    d.dingding = true;
                }
                this.loadOauthItem(d);
            }.bind(this));
        }

    },
    loadOauthItem: function (data) {
        var url = data.icon.indexOf("http") == 0 ? data.icon : ("data:image/png;base64," + data.icon);

        var itemNode = new Element("div", {
            styles: this.css.oauthItemNode,
            events: {
                click: function () {
                    var url = "../x_desktop/oauth.html?oauth=" + encodeURIComponent(this.name);
                    if (this.qywx) {
                        url += "&qywx=" + this.qywx;
                    }
                    if (this.dingding) {
                        url += "&dingding=" + this.dingding;
                    }
                    window.location = url;
                }.bind(data)
            }
        }).inject(this.oauthListNode);
        var iconNode = new Element("img", {
            styles: this.css.oauthItemIconNode,
            src: url
        }).inject(itemNode);
        var textNode = new Element("div", {
            styles: this.css.oauthItemTextNode,
            text: data.name
        }).inject(itemNode);
    },
    showTwoFactorySendMsgArea: function (){
        this.errorArea.empty();

        ["credentialTr","passwordTr","captchaTr", "forgetPasswordTr", "loginActionTr"].each(function (itemName){
            var node = this.formTableArea.getElement("[item='"+itemName+"']");
            if( node )node.setStyle("display", "none");
        }.bind(this));
        ["codeTr","hideTwoFactorySendMsgTr","twoFactorloginStep2Tr"].each(function (itemName){
            var node = this.formTableArea.getElement("[item='"+itemName+"']");
            if( node )node.setStyle("display", "");
        }.bind(this));
    },
    hideTwoFactorySendMsgArea: function (){
        this.errorArea.empty();

        if (this.captchaLogin) {
            var captchaItem = this.form.getItem("captchaAnswer");
            if (captchaItem){
                captchaItem.setValue( this.lp.verificationCode );
                this.setCaptchaPic();
            }
        }

        var codeItem = this.form.getItem("codeAnswerWithTwoFactorlogin");
        codeItem.options.notEmpty = false;
        codeItem.setValue( this.lp.inputVerificationCode );

        ["credentialTr","passwordTr","captchaTr", "forgetPasswordTr", "loginActionTr"].each(function (itemName){
            var node = this.formTableArea.getElement("[item='"+itemName+"']");
            if( node )node.setStyle("display", "");
        }.bind(this));
        ["codeTr","hideTwoFactorySendMsgTr","twoFactorloginStep2Tr"].each(function (itemName){
            var node = this.formTableArea.getElement("[item='"+itemName+"']");
            if( node )node.setStyle("display", "none");
        }.bind(this));
    },
    showExampleArea: function () {
        if (this.isHiddingExample || this.isShowingExample) return;
        if (!this.isShowEnable) return;
        this.isShowingExample = true;
        var left = this.bindBodyArea.getPosition(this.bindBodyArea.getParent()).x;
        var hideLeft = ((this.bindBodyArea.getParent().getSize().x) - 400) / 2;
        this.intervalId = setInterval(function () {
            if (left > hideLeft) {
                this.bindBodyArea.setStyle("margin-left", (left - 5) + "px");
                left = left - 5;
            } else {
                clearInterval(this.intervalId);
                this.bindBodyArea.setStyle("width", "400px");
                this.bindSepArea.setStyle("display", "");
                this.bindExampleArea.setStyle("display", "");
                this.isHidEnable = true;
                this.isShowEnable = false;
                this.isShowingExample = false;
            }
        }.bind(this), 10)
    },
    hideExampleArea: function () {
        if (this.isShowingExample || this.isHiddingExample) return;
        if (!this.isHidEnable) return;
        this.isHiddingExample = true;
        var left = this.bindBodyArea.getPosition(this.bindBodyArea.getParent()).x;
        this.bindSepArea.setStyle("display", "none");
        this.bindExampleArea.setStyle("display", "none");
        var hideLeft = ((this.bindBodyArea.getParent().getSize().x) - 200) / 2;
        this.intervalId2 = setInterval(function () {
            if (left < hideLeft) {
                this.bindBodyArea.setStyle("margin-left", (left + 5) + "px");
                left = left + 5;
            } else {
                clearInterval(this.intervalId2);
                this.bindBodyArea.setStyle("width", "204px");
                this.isHidEnable = false;
                this.isShowEnable = true;
                this.isHiddingExample = false;
            }
        }.bind(this), 10)
    },
    showPasswordLogin: function () {
        this.errorArea.empty();
        this.loginType = "captcha";
        this.form.getItem("passwordAction").setStyles(this.css.titleNode_active);
        this.form.getItem("codeAction").setStyles(this.css.titleNode_normal);
        this.formTableArea.getElement("[item='passwordTr']").setStyle("display", "");
        var captchaTr = this.formTableArea.getElement("[item='captchaTr']");
        if (captchaTr) captchaTr.setStyle("display", "");
        this.formTableArea.getElement("[item='codeTr']").setStyle("display", "none");
    },
    showCodeLogin: function () {
        this.errorArea.empty();
        this.loginType = "code";

        var passwordAction = this.form.getItem("passwordAction");
        if(passwordAction)passwordAction.setStyles(this.css.titleNode_normal);

        var codeAction = this.form.getItem("codeAction");
        if(codeAction)codeAction.setStyles(this.css.titleNode_active);

        var passwordTr = this.formTableArea.getElement("[item='passwordTr']");
        if(passwordTr)passwordTr.setStyle("display", "none");

        var captchaTr = this.formTableArea.getElement("[item='captchaTr']");
        if (captchaTr) captchaTr.setStyle("display", "none");

        this.formTableArea.getElement("[item='codeTr']").setStyle("display", "");

    },
    showBindCodeLogin: function () {
        this.errorArea.empty();
        this.formTableContainer.setStyle("display", "none");
        this.bindLoginContainer.setStyle("display", "");
        if(this.bindLoginTipPic)this.bindLoginTipPic.setStyle("display", "none");
        if(this.bindLoginAction)this.bindLoginAction.setStyle("display", "none");
        if(this.backtoPasswordLoginTipPic)this.backtoPasswordLoginTipPic.setStyle("display", "");
        if(this.backtoPasswordLoginAction)this.backtoPasswordLoginAction.setStyle("display", "");
        this.checkBindStatus();
    },
    backtoPasswordLogin: function () {
        this.errorArea.empty();
        if (this.bindStatusInterval) clearInterval(this.bindStatusInterval);
        this.formTableContainer.setStyle("display", "");
        this.bindLoginContainer.setStyle("display", "none");
        this.bindLoginTipPic.setStyle("display", "");
        this.bindLoginAction.setStyle("display", "");
        this.backtoPasswordLoginTipPic.setStyle("display", "none");
        this.backtoPasswordLoginAction.setStyle("display", "none");
    },
    setBindPic: function () {
        this.bindPicArea.empty();
        this.actions.getLoginBind(function (json) {
            this.bindMeta = json.data.meta;
            new Element("img", {
                src: "data:image/png;base64," + json.data.image
            }).inject(this.bindPicArea);
        }.bind(this))
    },
    setCaptchaPic: function () {
        if (!this.captchaLogin) return;
        var captchaPic = this.formTableArea.getElement("[item='captchaPic']");
        captchaPic.empty();
        this.actions.getLoginCaptcha(160, 40, function (json) {
            this.captcha = json.data.id;
            new Element("img", {
                src: "data:image/png;base64," + json.data.image,
                styles: this.css.verificationImage
            }).inject(captchaPic);
        }.bind(this), null, true, null, false)
    },
    sendVerificationAction: function () {
        var flag = true;
        var credentialItem = this.form.getItem("credential");
        var credential = credentialItem.getValue();
        if (!credential || credential.trim() === "") {
            credentialItem.setWarning(this.lp.inputYourUserName, "empty");
            return;
        } else {
            // this.actions.checkCredential(credential, function (json) {
            //     if (!json.data.value) {
            //         flag = false;
            //         credentialItem.setWarning(this.lp.userNotExist, "invalid");
            //     }
            // }.bind(this), function (errorObj) {
            //     flag = false;
            //     var error = JSON.parse(errorObj.responseText);
            //     credentialItem.setWarning(error.message, "invalid");
            // }.bind(this), false)
        }
        if (!flag) {
            return;
        } else {
            credentialItem.clearWarning("invalid");
        }
        this.actions.createCredentialCode(credential, function (json) {
            if( json.data.value && typeOf(json.data.value) === 'string' ){
                var codeAnswerItem = this.form.getItem("codeAnswer");
                if(codeAnswerItem){
                    codeAnswerItem.clearWarning("empty");
                }
                this.setInfor(json.data.value);
            }
        }.bind(this), function (errorObj) {
            var error = JSON.parse(errorObj.responseText);
            var codeAnswerItem = this.form.getItem("codeAnswer");
            if(codeAnswerItem){
                codeAnswerItem.clearWarning("empty");
            }
            this.setWarning(error.message);
            flag = false;
        }.bind(this));
        if (!flag) {
            return;
        } else {
            this.errorArea.empty();
        }
        this.form.getItem("verificationAction").container.setStyle("display", "none");
        this.setResendVerification();
    },
    setResendVerification: function () {
        var resendItem = this.form.getItem("resendVerificationAction");
        resendItem.container.setStyle("display", "");
        this.resendElement = resendItem.getElements()[0];
        this.resendElement.set("text", this.lp.resendVerification + "(60)");

        var i = 60;
        this.timer = setInterval(function () {
            if (i > 0) {
                this.resendElement.set("text", this.lp.resendVerification + "(" + --i + ")")
            } else {
                this.form.getItem("verificationAction").container.setStyle("display", "");
                resendItem.container.setStyle("display", "none");
                clearInterval(this.timer)
            }
        }.bind(this), 1000)
    },
    gotoSignup: function () {
        this.explorer.openSignUpForm();
        //this.explorer.openResetPasswordForm();
        this.close();
    },
    gotoResetPassword: function () {
        this.explorer.openResetPasswordForm();
        this.close();
    },
    gotoChangePassword : function( options ){ //密码过期
        this.explorer.openChangePasswordForm( options, function(){
            this.explorer.loadLogin();
        }.bind(this));
        this.close();
    },
    checkBindStatus: function () {
        this.bindStatusInterval = setInterval(function () {
            this.actions.checkBindStatus(this.bindMeta, function (json) {
                if (json.data) {
                    if (json.data.name && json.data.name !== "anonymous") {
                        this.fireEvent("queryOk");
                        this._close();
                        if (this.formMaskNode) this.formMaskNode.destroy();
                        this.formAreaNode.destroy();
                        if (this.explorer && this.explorer.view) this.explorer.view.reload();
                        if (this.app) this.app.notice(this.lp.loginSuccess, "success");
                        this.fireEvent("postOk", json);
                    }
                }
            }.bind(this), function (errorObj) {
                var error = JSON.parse( errorObj.responseText );
                if (this.app) {
                    this.app.notice(error.message, "error");
                }else{
                    this.setBindWarning( error.message );
                }
            }.bind(this))
        }.bind(this), 3000);

    },
    _close: function () {
        if (this.bindStatusInterval) clearInterval(this.bindStatusInterval);
        if (this.timer) clearInterval(this.timer);
    },
    ok: function () {
        this.fireEvent("queryOk");
        this.errorArea.empty();
        var captchaItem = null;
        var codeItem = null;

        if (this.loginType === "captcha") {
            if( this.userPwdLogin ){
                this.form.getItem("password").options.notEmpty = true;
            }

            if (this.captchaLogin) {
                captchaItem = this.form.getItem("captchaAnswer");
                if (captchaItem) captchaItem.options.notEmpty = true;
            }

            codeItem = this.form.getItem("codeAnswer");
            if (codeItem) codeItem.options.notEmpty = false;
        } else if (this.loginType === "code") {
            if( this.userPwdLogin ){
                this.form.getItem("password").options.notEmpty = false;
            }
            if (this.captchaLogin) {
                captchaItem = this.form.getItem("captchaAnswer");
                if (captchaItem) captchaItem.options.notEmpty = false;
            }
            codeItem = this.form.getItem("codeAnswer");
            if (codeItem) codeItem.options.notEmpty = true;
        }
        var data = this.form.getResult(true, ",", true, false, true);
        if (data) {
            this._ok(data, function (json) {
                this.afterLogin( json );
            }.bind(this));
        }
    },
    afterLogin: function (json) {
        if (json.type === "error") {
            if (this.app) this.app.notice(json.message, "error");
        } else if( json.data.passwordExpired ){ //密码过期
            var userName = json.data.distinguishedName;
            this.explorer.logout( function(){ //注销再到密码修改页
                this.gotoChangePassword({
                    userName : userName
                });
            }.bind(this))
        } else {
            this._close();
            if (this.formMaskNode) this.formMaskNode.destroy();
            this.formAreaNode.destroy();
            if (this.explorer && this.explorer.view) this.explorer.view.reload();
            if (this.app) this.app.notice(this.lp.loginSuccess, "success");
            this.fireEvent("postOk", json);
        }
    },
    doTwoFactorlogin: function (){
        var codeItem = this.form.getItem("codeAnswerWithTwoFactorlogin");
        codeItem.options.notEmpty = true;
        if ( codeItem.verify(true) ) {
            var d = {
                credential: this.captchaLoginData.credential,
                codeAnswer: codeItem.getValue()
            };
            this.actions.loginByCode(d, function (json) {
                codeItem.options.notEmpty = false;
                this.afterLogin(json);
            }.bind(this), function (errorObj) {
                codeItem.options.notEmpty = false;
                var error = JSON.parse(errorObj.responseText);
                this.setWarning(error.message);
            }.bind(this));
        }
    },
    setInfor: function (text) {
        this.errorArea.empty();
        new Element("div", {
            "text": text,
            "styles": this.css.inforMessageNode
        }).inject(this.errorArea);
    },
    setWarning: function (text) {
        this.errorArea.empty();
        new Element("div", {
            "text": text,
            "styles": this.css.warningMessageNode
        }).inject(this.errorArea);
    },
    setBindWarning: function (text) {
        if( this.bindErrorArea ){
            this.bindErrorArea.empty();
            new Element("div", {
                "text": text,
                "styles": this.css.warningMessageNode
            }).inject(this.bindErrorArea);
        }
    },
    _ok: function (data, callback) {
        var d = null;
        if (this.loginType === "captcha") {
            d = {
                credential: data.credential,
                password: data.password
            };
            if (this.captchaLogin) {
                d.captchaAnswer = data.captchaAnswer;
                d.captcha = this.captcha;
            }
            if( this.twoFactorLogin ){
                 this.captchaLoginData = d;

                this.actions.loginByTwoFactor(d, function (json){
                    if( json.data.passwordExpired ){ //密码过期
                        //var userName = json.data.distinguishedName;
                        this.gotoChangePassword({
                            userName : d.credential,
                            oldPassword: d.password
                        });
                    }else{
                        this.showTwoFactorySendMsgArea();
                    }
                 }.bind(this), function (errorObj) {
                     var error = JSON.parse(errorObj.responseText);
                     this.setWarning(error.message);
                     this.setCaptchaPic();
                     if (this.form.getItem("captchaAnswer")) this.form.getItem("captchaAnswer").setValue("");
                 }.bind(this));
            }else{
                this.actions.loginByCaptcha(d, function (json) {
                    if (callback) callback(json);
                    //this.fireEvent("postOk")
                }.bind(this), function (errorObj) {
                    var error = JSON.parse(errorObj.responseText);
                    this.setWarning(error.message);
                    this.setCaptchaPic();
                    if (this.form.getItem("captchaAnswer")) this.form.getItem("captchaAnswer").setValue("");
                }.bind(this));
            }
        } else if (this.loginType === "code") {
            d = {
                credential: data.credential,
                codeAnswer: data.codeAnswer
            };
            this.actions.loginByCode(d, function (json) {
                if (callback) callback(json);
                //this.fireEvent("postOk")
            }.bind(this), function (errorObj) {
                var error = JSON.parse(errorObj.responseText);
                this.setWarning(error.message);
            }.bind(this));
        }
    }
});

MWF.xDesktop.Authentication.SignUpForm = new Class({
    Extends: MPopupForm,
    Implements: [Options, Events],
    options: {
        "style": "default",
        "popupStyle": "o2platformSignup",
        "width": "910",
        "height": "740",
        "hasTop": true,
        "hasIcon": false,
        "hasTopIcon": true,
        "hasTopContent": true,
        "hasBottom": false,
        "title": "",
        "draggable": true,
        "closeAction": true
    },
    load: function () {
        if (!this.options.title) this.setOptions({
            "title": MWF.LP.authentication.SignUpFormTitle
        });
        this._loadCss();
    },
    _createTableContent: function () {
        if( this.formTopTextNode && this.formTopCloseActionNode ){
            this.formTopCloseActionNode.inject( this.formTopTextNode, "before" )
        }

        var self = this;

        this.actions = MWF.Actions.get("x_organization_assemble_personal");

        var signUpMode = "code";
        this.actions.getRegisterMode(function (json) {
            signUpMode = json.data.value;
        }.bind(this), null, false);

        this.formTopNode.setStyle("height","50px");
        this.formTableContainer.setStyles({
            "width": "890px",
            "margin-top": "40px"
        });

        var html = "<table width='100%' bordr='0' cellpadding='5' cellspacing='0' styles='formTable'>" +
            "<tr><td styles='formTableTitle' lable='name' width='200'></td>" +
            "   <td styles='formTableValue' width='350'>" +
            "       <div style='position: relative;'><div item='name'></div><div class='inputUserIcon'></div></div>" +
            "   </td>" +
            "   <td styles='formTableValue' item='nameTip'></td></tr>" +
            "<tr><td styles='formTableTitle' lable='password'></td>" +
            "   <td styles='formTableValue'>" +
            "       <div style='position: relative;'><div item='password'></div><div class='inputPasswordIcon'></div></div>" +
            "   </td>" +
            "   <td styles='formTableValue'><div item='passwordStrengthArea'></div></div><div item='passwordTip'></div></td></tr>" +
            "<tr><td styles='formTableTitle' lable='confirmPassword'></td>" +
            "   <td styles='formTableValue'>" +
            "       <div style='position: relative;'><div item='confirmPassword'></div><div class='inputComfirmPasswordIcon'></div></div>" +
            "   </td>" +
            "   <td styles='formTableValue' item='confirmPasswordTip'></td></tr>" +
            "<tr><td styles='formTableTitle' lable='genderType'></td>" +
            "   <td styles='formTableValue' item='genderType'></td>" +
            "   <td styles='formTableValue' item='genderTypeTip'></td></tr>" +
            "<tr><td styles='formTableTitle' lable='mail'></td>" +
            "   <td styles='formTableValue'>" +
            "       <div style='position: relative;'><div item='mail'></div><div class='inputMailIcon'></div></div>" +
            "   </td>" +
            "   <td styles='formTableValue' item='mailTip'></td></tr>" +
            "<tr><td styles='formTableTitle' lable='mobile'></td>" +
            "   <td styles='formTableValue'>" +
            "       <div style='position: relative;'><div item='mobile'></div><div class='inputMobileIcon'></div></div>" +
            "   </td>" +
            "   <td styles='formTableValue' item='mobileTip'></td></tr>";
        if (signUpMode === "code") {
            html += "<tr><td styles='formTableTitle' lable='codeAnswer'></td>" +
                "   <td styles='formTableValue'>" +
                "       <div style='float:left;'>" +
                "           <div style='position: relative;'><div item='codeAnswer'></div><div class='inputVerificationCode2Icon'></div></div>" +
                "       </div>" +
                "       <div item='verificationAction' style='float:left;'></div>" +
                "       <div item='resendVerificationAction' style='float:left;display:none;'></div>" +
                "   </td>" +
                "   <td styles='formTableValue' item='verificationCodeTip'></td></tr>";
        } else {
            html += "<tr><td styles='formTableTitle' lable='captchaAnswer'></td>" +
                "   <td styles='formTableValue'>" +
                "       <div style='float:left;'>" +
                "           <div style='position: relative;'><div item='captchaAnswer'></div><div class='inputVerificationCodeIcon'></div></div>" +
                "       </div>" +
                "       <div item='captchaPic' style='float:left;'></div>" +
                "       <div item='changeCaptchaAction' style='float:left;'></div>" +
                "   </td>" +
                "   <td styles='formTableValue' item='captchaAnswerTip'></td></tr>";
        }
        html += "<tr><td styles='formTableTitle'></td>" +
            "   <td styles='formTableValue' item='signUpAction'></td>" +
            "   <td styles='formTableValue' item='signUpTip'></td></tr>" +
            "<tr><td></td>" +
            "   <td><div item='hasAccountArea'></div><div item='gotoLoginAction'></div></td>" +
            "   <td></td></tr>" +
            "</table>";
        this.formTableArea.set("html", html);

        if (signUpMode === "captcha") {
            this.setCaptchaPic();
        }
        //this.createPasswordStrengthNode();

        MWF.xDesktop.requireApp("Template", "MForm", function () {
            this.form = new MForm(this.formTableArea, this.data, {
                style: this.options.popupStyle,
                verifyType: "batchSingle",	//batch一起校验，或alert弹出
                isEdited: this.isEdited || this.isNew,
                onPostLoad: function () {
                    var form = this.form;
                    var table = this.formTableArea;
                    form.getItem("name").tipNode = table.getElement("[item='nameTip']");
                    form.getItem("password").tipNode = table.getElement("[item='passwordTip']");
                    form.getItem("confirmPassword").tipNode = table.getElement("[item='confirmPasswordTip']");
                    form.getItem("mail").tipNode = table.getElement("[item='mailTip']");
                    form.getItem("genderType").tipNode = table.getElement("[item='genderTypeTip']");
                    form.getItem("mobile").tipNode = table.getElement("[item='mobileTip']");
                    this.tipNode = table.getElement("[item='signUpTip']");
                    var captchaAnswer = form.getItem("captchaAnswer");
                    if (captchaAnswer) {
                        form.getItem("captchaAnswer").tipNode = table.getElement("[item='captchaAnswerTip']");
                    }
                    var codeAnswer = form.getItem("codeAnswer");
                    if (codeAnswer) {
                        form.getItem("codeAnswer").tipNode = table.getElement("[item='verificationCodeTip']");
                    }
                }.bind(this),
                itemTemplate: {
                    name: {
                        text: this.lp.userName, defaultValue: this.lp.userName, className: "inputUser",
                        notEmpty: true, defaultValueAsEmpty: true, emptyTip: this.lp.inputYourUserName,
                        validRule: { isInvalid: function (value, it) { return this.checkUserName(value, it); }.bind(this) },
                        validMessage: { isInvalid: this.lp.userExist },
                        event: {
                            focus: function (it) { if (this.lp.userName === it.getValue()) it.setValue(""); if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputActive); }.bind(this),
                            keyup: function (it, ev) { if (ev.event.keyCode === 13) { this.ok() } }.bind(this),
                            blur: function (it) {
                                if (it.verify(true)) {
                                    if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputUser);
                                }
                            }.bind(this)
                        }, onEmpty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputEmpty);
                        }.bind(this), onUnempty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputUser);
                        }.bind(this)
                    },
                    password: {
                        text: this.lp.password, type: "password", className: "inputPassword",
                        notEmpty: true, defaultValueAsEmpty: true, emptyTip: this.lp.inputYourPassword,
                        validRule: {
                            passwordIsWeak: function (value, it) {
                                return !this.getPasswordRule(it.getValue());
                            }.bind(this)
                        },
                        validMessage: {
                            passwordIsWeak: function () {
                                return self.getPasswordRule(this.getValue());
                            }
                        }, //this.lp.passwordIsSimple
                        event: {
                            focus: function (it) { if ("password" === it.getValue()) it.setValue(""); if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputActive); }.bind(this),
                            //keyup : function(it){ this.pwStrength(it.getValue()) }.bind(this),
                            blur: function (it) { it.verify(true) }.bind(this)
                        }, onEmpty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputEmpty);
                        }.bind(this), onUnempty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputPassword);
                        }.bind(this)
                    },
                    confirmPassword: {
                        text: this.lp.confirmPassword, type: "password", className: "inputComfirmPassword",
                        notEmpty: true, defaultValueAsEmpty: true, emptyTip: this.lp.inputComfirmPassword,
                        validRule: {
                            passwordNotEqual: function (value, it) {
                                if (it.getValue() === this.form.getItem("password").getValue()) return true;
                            }.bind(this)
                        },
                        validMessage: { passwordNotEqual: this.lp.passwordNotEqual },
                        event: {
                            focus: function (it) { if ("password" === it.getValue()) it.setValue(""); if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputActive); }.bind(this),
                            keyup: function (it, ev) { if (ev.event.keyCode === 13) { this.ok() } }.bind(this),
                            blur: function (it) {
                                if (it.verify(true)) {
                                    if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputComfirmPassword);
                                }
                            }.bind(this)
                        }, onEmpty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputEmpty);
                        }.bind(this), onUnempty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputComfirmPassword);
                        }.bind(this)
                    },
                    mail: {
                        text: this.lp.mail, defaultValue: this.lp.inputYourMail, className: "inputMail",
                        notEmpty: false, defaultValueAsEmpty: true, emptyTip: this.lp.inputYourMail,
                        validRule: { isFormatInvalid: function (value, it) {
                            if( (!value || value===this.lp.inputYourMail) ||
                                /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test( value ) ){
                                it.tipNode.empty();
                                it.warningStatus = false;
                                return true;
                            }else{
                                it.warningStatus = true;
                                return false;
                            }
                        }.bind(this) },
                        validMessage: { isFormatInvalid: this.lp.mailFormatError },
                        event: { //validRule: { email: false },
                            focus: function (it) {
                                if (this.lp.inputYourMail === it.getValue()) it.setValue("");
                                if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputActive);
                            }.bind(this),
                            blur: function (it) {
                                it.verify(true);
                                if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputMail);
                            }.bind(this),
                            keyup: function (it, ev) { if (ev.event.keyCode === 13) { this.ok() } }.bind(this)
                        }, onEmpty: function (it) {
                            // it.getElements()[0].setStyles(this.css.inputEmpty);
                        }.bind(this), onUnempty: function (it) {
                            // it.getElements()[0].setStyles(this.css.inputMail);
                        }.bind(this)
                    },
                    genderType: {
                        text: this.lp.genderType, className: "inputGenderType", type: "select", selectValue: this.lp.genderTypeValue.split(","), selectText: this.lp.genderTypeText.split(","),
                        notEmpty: true, emptyTip: this.lp.selectGenderType, event: {
                            focus: function (it) { if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputActive); }.bind(this),
                            blur: function (it) { it.verify(true); if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputGenderType); }.bind(this),
                            keyup: function (it, ev) { if (ev.event.keyCode === 13) { this.ok() } }.bind(this)
                        }, onEmpty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputEmpty);
                        }.bind(this), onUnempty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputGenderType);
                        }.bind(this)
                    },
                    mobile: {
                        text: this.lp.mobile, defaultValue: this.lp.inputYourMobile, className: "inputMobile", tType: "number",
                        notEmpty: true, defaultValueAsEmpty: true, emptyTip: this.lp.inputYourMobile,
                        validRule: { isInvalid: function (value, it) { return this.checkMobile(value, it); }.bind(this) },
                        validMessage: { isInvalid: this.lp.mobileIsRegisted },
                        event: {
                            focus: function (it) { if (this.lp.inputYourMobile === it.getValue()) it.setValue(""); if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputActive); }.bind(this),
                            keyup: function (it, ev) { if (ev.event.keyCode === 13) { this.ok() } }.bind(this),
                            blur: function (it) {
                                if (it.verify(true)) {
                                    if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputMobile);
                                }
                            }.bind(this)
                        }, onEmpty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputEmpty);
                        }.bind(this), onUnempty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputMobile);
                        }.bind(this)
                    },
                    captchaAnswer: {
                        tType: "number", text: this.lp.verificationCode, defaultValue: this.lp.verificationCode, className: "inputVerificationCode",
                        notEmpty: true, defaultValueAsEmpty: true, emptyTip: this.lp.inputPicVerificationCode, event: {
                            focus: function (it) { if (this.lp.verificationCode === it.getValue()) it.setValue(""); if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputActive); }.bind(this),
                            blur: function (it) { it.verify(true); if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputVerificationCode); }.bind(this),
                            keyup: function (it, ev) { if (ev.event.keyCode === 13) { this.ok() } }.bind(this)
                        }, onEmpty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputEmpty);
                        }.bind(this), onUnempty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputVerificationCode);
                        }.bind(this)
                    },
                    changeCaptchaAction: {
                        value: this.lp.changeVerification, type: "innerText", className: "verificationChange", event: {
                            click: function () {
                                this.setCaptchaPic();
                            }.bind(this)
                        }
                    },
                    codeAnswer: {
                        text: this.lp.verificationCode, defaultValue: this.lp.inputVerificationCode, className: "inputVerificationCode2",
                        notEmpty: true, defaultValueAsEmpty: true, emptyTip: this.lp.inputVerificationCode, event: {
                            focus: function (it) { if (this.lp.inputVerificationCode === it.getValue()) it.setValue(""); if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputActive); }.bind(this),
                            blur: function (it) { it.verify(true); if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputVerificationCode2); }.bind(this),
                            keyup: function (it, ev) { if (ev.event.keyCode === 13) { this.ok() } }.bind(this)
                        }, onEmpty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputEmpty);
                        }.bind(this), onUnempty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputVerificationCode2);
                        }.bind(this)
                    },
                    verificationAction: {
                        value: this.lp.sendVerification, type: "button", className: "inputSendVerification", event: {
                            click: function () { this.sendVerificationAction() }.bind(this)
                        }
                    },
                    resendVerificationAction: { value: this.lp.resendVerification, type: "button", className: "inputResendVerification" },
                    signUpAction: {
                        value: this.lp.signUp, type: "button", className: "inputSignUp", event: {
                            click: function () { this.ok() }.bind(this)
                        }
                    },
                    hasAccountArea: { value: this.lp.hasAccount, type: "innerText", className: "hasCountArea" },
                    gotoLoginAction: {
                        value: this.lp.gotoLogin, type: "innerText", className: "gotoLoginAction", event: {
                            click: function () { this.gotoLogin() }.bind(this)
                        }
                    }
                }
            }, this.app, this.css);
            this.form.load();
        }.bind(this), true);
    },
    checkMobile: function (mobile, it) {
        var flag = true;
        this.actions.checkRegisterMobile(mobile, function () {
            flag = true
        }.bind(this), function (errorObj) {
            if (errorObj.status === 404) {
                it.options.validMessage.isInvalid = this.lp.pageNotFound;
                flag = false;
            } else {
                var error = JSON.parse(errorObj.responseText);
                it.options.validMessage.isInvalid = error.message;
                flag = false;
            }
        }.bind(this), false);
        return flag;
    },
    checkUserName: function (userName, it) {
        var flag = true;
        this.actions.checkRegisterName(userName, function () {
            flag = true
        }.bind(this), function (errorObj) {
            if (errorObj.status === 404) {
                it.options.validMessage.isInvalid = this.lp.pageNotFound;
                flag = false
            } else {
                var error = JSON.parse(errorObj.responseText);
                it.options.validMessage.isInvalid = error.message;
                flag = false
            }
        }.bind(this), false);
        return flag;
    },
    setCaptchaPic: function () {
        var captchaPic = this.formTableArea.getElement("[item='captchaPic']");
        captchaPic.empty();
        this.actions.getRegisterCaptcha(160, 40, function (json) {
            this.captcha = json.data.id;
            new Element("img", {
                src: "data:image/png;base64," + json.data.image,
                styles: this.css.verificationImage
            }).inject(captchaPic);
        }.bind(this))
    },
    sendVerificationAction: function () {
        var flag = true;
        var it = this.form.getItem("mobile");
        if (it.verify(true)) {
            it.clearWarning();
            it.getElements()[0].setStyles(this.css.inputMobile);
        } else {
            return;
        }
        this.actions.createRegisterCode(it.getValue(), function (json) {

        }, function (errorObj) {
            var codeIt = this.form.getItem("codeAnswer");
            var error = JSON.parse(errorObj.responseText);
            if (errorObj.status === 404) {
                codeIt.setWarning(error.message, this.lp.pageNotFound);
                flag = false;
            } else {
                codeIt.setWarning(error.message, "invalid");
                flag = false;
            }
        }.bind(this), false);

        if (!flag) return false;
        this.form.getItem("verificationAction").container.setStyle("display", "none");
        this.setResendVerification();
    },
    setResendVerification: function () {
        var resendItem = this.form.getItem("resendVerificationAction");
        resendItem.container.setStyle("display", "");
        this.resendElement = resendItem.getElements()[0];
        this.resendElement.set("text", this.lp.resendVerification + "(60)");

        var i = 60;
        this.timer = setInterval(function () {
            if (i > 0) {
                this.resendElement.set("text", this.lp.resendVerification + "(" + --i + ")")
            } else {
                this.form.getItem("verificationAction").container.setStyle("display", "");
                resendItem.container.setStyle("display", "none");
                clearInterval(this.timer)
            }
        }.bind(this), 1000)
    },
    getPasswordRule: function (password) {
        var str = "";
        this.actions.checkRegisterPassword(password, function (json) {
            str = json.data.value || "";
        }.bind(this), null, false);
        return str;
    },
    //createPasswordStrengthNode : function(){
    //    var passwordStrengthArea = this.formTableArea.getElement("[item='passwordStrengthArea']");
    //
    //    var lowNode = new Element( "div", {styles : this.css.passwordStrengthNode }).inject( passwordStrengthArea );
    //    this.lowColorNode = new Element( "div", {styles : this.css.passwordStrengthColor }).inject( lowNode );
    //    this.lowTextNode = new Element( "div", {styles : this.css.passwordStrengthText, text : this.lp.weak }).inject( lowNode );
    //
    //    var middleNode = new Element( "div" , {styles : this.css.passwordStrengthNode }).inject( passwordStrengthArea );
    //    this.middleColorNode = new Element( "div", {styles : this.css.passwordStrengthColor }).inject( middleNode );
    //    this.middleTextNode = new Element( "div", {styles : this.css.passwordStrengthText, text : this.lp.middle }).inject( middleNode );
    //
    //    var highNode = new Element("div", {styles : this.css.passwordStrengthNode }).inject( passwordStrengthArea );
    //    this.highColorNode = new Element( "div", {styles : this.css.passwordStrengthColor }).inject( highNode );
    //    this.highTextNode = new Element( "div", {styles : this.css.passwordStrengthText, text : this.lp.high }).inject( highNode );
    //},
    //getPasswordLevel: function( password ){
    //    // Level（级别）
    //    //  •0-3 : [easy]
    //    //  •4-6 : [midium]
    //    //  •7-9 : [strong]
    //    //  •10-12 : [very strong]
    //    //  •>12 : [extremely strong]
    //    var level = 0;
    //    this.actions.checkRegisterPassword( password, function( json ){
    //        level = json.data.value;
    //    }.bind(this), null, false );
    //    return level;
    //},
    //pwStrength: function(pwd){
    //    this.lowColorNode.setStyles( this.css.passwordStrengthColor );
    //    this.lowTextNode.setStyles( this.css.passwordStrengthText );
    //    this.middleColorNode.setStyles( this.css.passwordStrengthColor );
    //    this.middleTextNode.setStyles( this.css.passwordStrengthText );
    //    this.highColorNode.setStyles( this.css.passwordStrengthColor );
    //    this.highTextNode.setStyles( this.css.passwordStrengthText );
    //    if (!pwd){
    //    }else{
    //        //var level = this.checkStrong(pwd);
    //        var level = this.getPasswordLevel(pwd);
    //        switch(level) {
    //            case 0:
    //            case 1:
    //            case 2:
    //            case 3:
    //                this.lowColorNode.setStyles( this.css.passwordStrengthColor_low );
    //                this.lowTextNode.setStyles( this.css.passwordStrengthText_current );
    //                break;
    //            case 4:
    //            case 5:
    //            case 6:
    //                this.middleColorNode.setStyles( this.css.passwordStrengthColor_middle );
    //                this.middleTextNode.setStyles( this.css.passwordStrengthText_current );
    //                break;
    //            default:
    //                this.highColorNode.setStyles( this.css.passwordStrengthColor_high );
    //                this.highTextNode.setStyles( this.css.passwordStrengthText_current );
    //        }
    //    }
    //},
    gotoLogin: function () {
        this.explorer.openLoginForm({}, function () { window.location.reload(); });
        this.close();
    },
    setWarning: function (text) {
        this.tipNode.empty();
        new Element("div", {
            "text": text,
            "styles": this.css.warningMessageNode
        }).inject(this.tipNode);
    },
    setNotice: function (text) {
        this.tipNode.empty();
        new Element("div", {
            "text": text,
            "styles": this.css.noticeMessageNode
        }).inject(this.tipNode);
    },
    ok: function () {
        this.tipNode.empty();
        this.fireEvent("queryOk");
        var data = this.form.getResult(true, ",", true, false, true);
        if (data) {
            this._ok(data, function (json) {
                if (json.type === "error") {
                    if (this.app) this.app.notice(json.message, "error");
                } else {
                    if (this.formMaskNode) this.formMaskNode.destroy();
                    this.formAreaNode.destroy();
                    this.setNotice(this.lp.registeSuccess);
                    if (this.app) this.app.notice(this.lp.registeSuccess, "success");
                    this.fireEvent("postOk", json);
                    this.gotoLogin();
                }
            }.bind(this))
        }
    },
    _ok: function (data, callback) {
        data.captcha = this.captcha;
        this.actions.register(data, function (json) {
            if (callback) callback(json);
        }.bind(this), function (errorObj) {
            if (errorObj.status === 404) {
                this.setWarning(this.lp.pageNotFound);
            } else {
                var error = JSON.parse(errorObj.responseText);
                this.setWarning(error.message);
            }
        }.bind(this));
    }
});

//忘记密码
MWF.xDesktop.Authentication.ResetPasswordForm = new Class({
    Extends: MPopupForm,
    Implements: [Options, Events],
    options: {
        "style": "default",
        "popupStyle": "o2platformSignup",
        "width": "710",
        "height": "450",
        "hasTop": true,
        "hasIcon": false,
        "hasTopIcon": true,
        "hasTopContent": true,
        "hasBottom": false,
        "title": "",
        "draggable": true,
        "closeAction": true
    },
    load: function () {
        if (!this.options.title) this.setOptions({
            "title": MWF.LP.authentication.ResetPasswordFormTitle
        });
        this._loadCss();
    },
    _createTopContent: function () {

        this.actions = MWF.Actions.get("x_organization_assemble_personal");

        this.actions.getRegisterMode(function (json) {
            this.signUpMode = json.data.value;
        }.bind(this), null, false);
        if (this.signUpMode && this.signUpMode !== "disable") {
            this.gotoSignupNode = new Element("div", {
                styles: this.css.formTopContentCustomNode,
                text: this.lp.signUp
            }).inject(this.formTopContentNode);
            this.gotoSignupNode.addEvent("click", function () { this.gotoSignup() }.bind(this));

            new Element("div", { styles: this.css.formTopContentSepNode }).inject(this.formTopContentNode);
        }

        this.gotoLoginNode = new Element("div", {
            styles: this.css.formTopContentCustomNode,
            text: this.lp.loginAction
        }).inject(this.formTopContentNode);
        this.gotoLoginNode.addEvent("click", function () { this.gotoLogin() }.bind(this));
    },
    _createTableContent: function () {

        if( this.formTopTextNode && this.formTopCloseActionNode ){
            this.formTopCloseActionNode.inject( this.formTopTextNode, "before" )
        }

        this.formTableContainer.setStyles(this.css.formTableContainer2);
        this.loadSteps();
        this.loadStepForm_1();
        this.loadStepForm_2();
        this.loadStepForm_3();

    },
    reset: function () {
        this.formTableArea.empty();
        this._createTableContent();
    },
    loadSteps: function () {
        var stepsContainer = new Element("div", { styles: this.css.stepsContainer }).inject(this.formTableArea);
        this.step_1 = new Element("div", {
            styles: this.css.step_1_active,
            text: this.lp.shotMessageCheck
        }).inject(stepsContainer);
        this.stepLink_1 = new Element("div", { styles: this.css.stepLink_1 }).inject(this.step_1);

        this.step_2 = new Element("div", {
            styles: this.css.step_2,
            text: this.lp.setMewPassword
        }).inject(stepsContainer);
        this.stepLink_2 = new Element("div", { styles: this.css.stepLink_2 }).inject(this.step_2);

        this.step_3 = new Element("div", {
            styles: this.css.step_3,
            text: this.lp.completed
        }).inject(stepsContainer);

    },
    loadStepForm_1: function () {
        var html = "<table width='100%' bordr='0' cellpadding='5' cellspacing='0' styles='formTable'>" +
            "<tr><td styles='formTableTitle' lable='name' width='80'></td>" +
            "   <td styles='formTableValue' width='350'>" +
            "       <div style='position: relative;'><div item='name'></div><div class='inputUserIcon'></div></div>" +
            "   </td>" +
            "</tr>" +
            "<tr><td styles='formTableTitle' lable='codeAnswer'></td>" +
            "   <td styles='formTableValue'>" +
            "       <div style='float:left;'>" +
            "           <div style='position: relative;'><div item='codeAnswer'></div><div class='inputVerificationCode2Icon'></div></div>" +
            "       </div>" +
            "       <div item='verificationAction' style='float:left;'></div>" +
            "       <div item='resendVerificationAction' style='float:left;display:none;'></div></td>" +
            "   </tr>" +
            "<tr><td styles='formTableTitle'></td>" +
            "   <td styles='formTableValue' item='nextStep'></td></tr>" +
            "</table>";
        this.stepNode_1 = new Element("div", { html: html, styles: { display: "" } }).inject(this.formTableArea);
        MWF.xDesktop.requireApp("Template", "MForm", function () {
            this.stepForm_1 = new MForm(this.stepNode_1, {}, {
                style: this.options.popupStyle,
                verifyType: "single",	//batch一起校验，或alert弹出
                isEdited: this.isEdited || this.isNew,
                itemTemplate: {
                    name: {
                        text: this.lp.userName, defaultValue: this.lp.userName, className: "inputUser",
                        notEmpty: true, defaultValueAsEmpty: true, emptyTip: this.lp.inputYourUserName,
                        // validRule: { isInvalid: function (value, it) { return this.checkUserName(value, it); }.bind(this) },
                        // validMessage: { isInvalid: this.lp.userNotExist },
                        event: {
                            focus: function (it) { if (this.lp.userName === it.getValue()) it.setValue(""); if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputActive); }.bind(this),
                            blur: function (it) { if (it.getValue() === "") it.setValue(this.lp.userName); if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputUser); }.bind(this),
                            keyup: function (it, ev) { if (ev.event.keyCode === 13) { this.gotoStep(2) } }.bind(this)
                        }, onEmpty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputEmpty);
                        }.bind(this), onUnempty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputUser);
                        }.bind(this)
                    },
                    codeAnswer: {
                        text: this.lp.verificationCode, defaultValue: this.lp.inputVerificationCode, className: "inputVerificationCode2",
                        notEmpty: true, defaultValueAsEmpty: true, emptyTip: this.lp.inputVerificationCode, event: {
                            focus: function (it) { if (this.lp.inputVerificationCode === it.getValue()) it.setValue(""); if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputActive); }.bind(this),
                            blur: function (it) {
                                if (it.getValue() === "") it.setValue(this.lp.inputVerificationCode);
                                if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputVerificationCode2);
                            }.bind(this),
                            keyup: function (it, ev) { if (ev.event.keyCode === 13) { this.gotoStep(2) } }.bind(this)
                        }, onEmpty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputEmpty);
                        }.bind(this), onUnempty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputVerificationCode2);
                        }.bind(this)
                    },
                    verificationAction: {
                        value: this.lp.sendVerification, type: "button", className: "inputSendVerification", event: {
                            click: function () { this.sendVerificationAction() }.bind(this)
                        }
                    },
                    resendVerificationAction: { value: this.lp.resendVerification, type: "button", className: "inputResendVerification" },
                    nextStep: {
                        value: this.lp.nextStep, type: "button", className: "inputSignUp", event: {
                            click: function () { this.gotoStep(2) }.bind(this)
                        }
                    }
                }
            }, this.app, this.css);
            this.stepForm_1.load();
        }.bind(this), true);
    },
    loadStepForm_2: function () {
        var self = this;

        html = "<table width='100%' bordr='0' cellpadding='5' cellspacing='0' styles='formTable'>" +
            "<tr><td styles='formTableTitle' lable='password' width='80'></td>" +
            "   <td styles='formTableValue' width='350'>" +
            "       <div style='position: relative;'><div item='password'></div><div class='inputPasswordIcon'></div></div>" +
            "   </td>" +
            "   <td styles='formTableValue'><div item='passwordStrengthArea'></div></td></tr>" +
            "<tr><td styles='formTableTitle' lable='confirmPassword'></td>" +
            "   <td styles='formTableValue'>" +
            "       <div style='position: relative;'><div item='confirmPassword'></div><div class='inputComfirmPasswordIcon'></div></div>" +
            "   </td>" +
            "   <td styles='formTableValue'></td></tr>" +
            "<tr><td styles='formTableTitle'></td>" +
            "   <td styles='formTableValue' item='nextStep'></td>" +
            "   <td styles='formTableValue'></td></tr>" +
            "</table>";
        this.stepNode_2 = new Element("div", {
            html: html,
            styles: { "display": "none" }
        }).inject(this.formTableArea);
        MWF.xDesktop.requireApp("Template", "MForm", function () {
            this.stepForm_2 = new MForm(this.stepNode_2, {}, {
                style: this.options.popupStyle,
                verifyType: "single",	//batch一起校验，或alert弹出
                isEdited: this.isEdited || this.isNew,
                itemTemplate: {
                    password: {
                        text: this.lp.setNewPassword, type: "password", className: "inputPassword",
                        notEmpty: true, defaultValueAsEmpty: true, emptyTip: this.lp.inputYourPassword,
                        attr: { "placeholder": this.lp.inputYourPassword },
                        validRule: {
                            passwordIsWeak: function (value, it) {
                                return !this.getPasswordRule(it.getValue());
                            }.bind(this)
                        },
                        validMessage: {
                            passwordIsWeak: function () {
                                return self.getPasswordRule(this.getValue());
                            }
                        },
                        event: {
                            focus: function (it) { if ("password" === it.getValue()) it.setValue(""); if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputActive); }.bind(this),
                            blur: function (it) { it.verify(true); }.bind(this)
                            //if( !it.warningStatus )it.getElements()[0].setStyles( this.css.inputPassword );
                            //keyup : function(it){ this.pwStrength(it.getValue()) }.bind(this)
                        }, onEmpty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputEmpty);
                        }.bind(this), onUnempty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputPassword);
                        }.bind(this)
                    },
                    confirmPassword: {
                        text: this.lp.confirmNewPassword, type: "password", className: "inputComfirmPassword",
                        notEmpty: true, defaultValueAsEmpty: true, emptyTip: this.lp.inputComfirmPassword,
                        attr: { "placeholder": this.lp.inputComfirmPassword },
                        validRule: {
                            passwordNotEqual: function (value, it) {
                                if (it.getValue() === this.stepForm_2.getItem("password").getValue()) return true;
                            }.bind(this)
                        },
                        validMessage: { passwordNotEqual: this.lp.passwordNotEqual },
                        event: {
                            focus: function (it) { if ("password" === it.getValue()) it.setValue(""); if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputActive); }.bind(this),
                            blur: function (it) { if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputComfirmPassword); }.bind(this),
                            keyup: function (it, ev) { if (ev.event.keyCode === 13) { this.gotoStep(3) } }.bind(this)
                        }, onEmpty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputEmpty);
                        }.bind(this), onUnempty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputComfirmPassword);
                        }.bind(this)
                    },
                    nextStep: {
                        value: this.lp.nextStep, type: "button", className: "inputSignUp", event: {
                            click: function () { this.gotoStep(3) }.bind(this)
                        }
                    }
                }
            }, this.app, this.css);
            this.stepForm_2.load();
        }.bind(this), true);

        //this.createPasswordStrengthNode();
    },
    loadStepForm_3: function () {
        this.stepNode_3 = new Element("div", {
            styles: this.css.stepFormResult
        }).inject(this.formTableArea);
    },
    createSetForm_3: function (isSuccess, text) {
        var area = null;
        var action = null;
        if (isSuccess) {
            this.stepNode_3.setStyles(this.css.stepFormResult);
            this.stepNode_3.setStyle("display", "");
            new Element("div", {
                styles: this.css.resetPasswordSuccess,
                text: this.lp.resetPasswordSuccess
            }).inject(this.stepNode_3);
            area = new Element("div", {
                styles: this.css.resetPasswordResultArea
            }).inject(this.stepNode_3);
            new Element("div", {
                styles: this.css.resetPasswordResultWord,
                text: this.lp.resetPasswordSuccessWord
            }).inject(area);
            action = new Element("div", {
                styles: this.css.resetPasswordResultAction,
                text: this.lp.gotoLogin
            }).inject(area);
            action.addEvent("click", function () { this.gotoLogin() }.bind(this));
        } else {
            this.stepNode_3.setStyles(this.css.stepFormResult_fail);
            this.stepNode_3.setStyle("display", "");
            new Element("div", {
                styles: this.css.resetPasswordFail,
                text: text + this.lp.resetPasswordFail
            }).inject(this.stepNode_3);
            area = new Element("div", {
                styles: this.css.resetPasswordResultArea
            }).inject(this.stepNode_3);
            new Element("div", {
                styles: this.css.resetPasswordResultWord,
                text: this.lp.resetPasswordFailWord
            }).inject(area);
            action = new Element("div", {
                styles: this.css.resetPasswordResultAction,
                text: this.lp.backtoModify
            }).inject(area);
            action.addEvent("click", function () { this.reset() }.bind(this));
        }
    },
    gotoStep: function (step) {
        var form = this["stepForm_" + (step - 1)];
        form.clearWarning();
        var data = form.getResult(true, ",", true, false, true);
        if (!data) {
            return;
        }
        var i;
        for (i = 1; i <= step; i++) {
            this["step_" + i].setStyles(this.css["step_" + i + "_active"]);
            if (i !== step && this["stepLink_" + i]) {
                this["stepLink_" + i].setStyles(this.css["stepLink_" + i + "_active"]);
            }
        }
        for (i = step + 1; i <= 3; i++) {
            this["step_" + i].setStyles(this.css["step_" + i]);
            if (i !== 3) {
                this["stepLink_" + i].setStyles(this.css["stepLink_" + i]);
            }
        }
        for (i = 1; i <= 3; i++) {
            if (i === step) {
                this["stepNode_" + i].setStyle("display", "");
            } else {
                this["stepNode_" + i].setStyle("display", "none");
            }
        }

        if (step === 3) {
            var d = {
                credential: this.stepForm_1.getItem("name").getValue(),
                codeAnswer: this.stepForm_1.getItem("codeAnswer").getValue(),
                password: this.stepForm_2.getItem("password").getValue()
            };
            this.actions.resetPassword(d, function () {
                this.createSetForm_3(true)
            }.bind(this), function (errorObj) {
                var error = JSON.parse(errorObj.responseText);
                //this.app.notice( error.message );
                this.createSetForm_3(false, error.message)
            }.bind(this), false);
        }
    },
    checkMobile: function (mobile) {
        var flag = true;
        this.actions.checkRegisterMobile(mobile, function () {
            flag = true
        }.bind(this), function () {
            flag = false;
        }.bind(this), false);
        return flag;
    },
    checkUserName: function (userName, it) {
        var flag = false;
        this.actions.checkCredentialOnResetPassword(userName, function (json) {
            if (json.data) {
                flag = json.data.value;
            }
        }.bind(this), function (errorObj) {
            if (errorObj.status === 404) {
                it.options.validMessage.isInvalid = this.lp.pageNotFound;
                flag = false
            } else {
                var error = JSON.parse(errorObj.responseText);
                it.options.validMessage.isInvalid = error.message;
                flag = false
            }
        }.bind(this), false);
        return flag;
    },
    sendVerificationAction: function () {
        var flag = true;
        var it = this.stepForm_1.getItem("name");
        this.stepForm_1.clearWarning();
        if (it.verify(true)) {
        } else {
            return;
        }
        this.actions.createCodeOnResetPassword(it.getValue(), function (json) {

        }, function (errorObj) {
            var error = JSON.parse(errorObj.responseText);
            it.setWarning(error.message, "invalid");
            flag = false
        }.bind(this), false);

        if (!flag) return false;
        this.stepForm_1.getItem("verificationAction").container.setStyle("display", "none");
        this.setResendVerification();
    },
    setResendVerification: function () {
        var resendItem = this.stepForm_1.getItem("resendVerificationAction");
        resendItem.container.setStyle("display", "");
        this.resendElement = resendItem.getElements()[0];
        this.resendElement.set("text", this.lp.resendVerification + "(60)");

        var i = 60;
        this.timer = setInterval(function () {
            if (i > 0) {
                this.resendElement.set("text", this.lp.resendVerification + "(" + --i + ")")
            } else {
                this.stepForm_1.getItem("verificationAction").container.setStyle("display", "");
                resendItem.container.setStyle("display", "none");
                clearInterval(this.timer)
            }
        }.bind(this), 1000)
    },
    getPasswordRule: function (password) {
        var str = "";
        this.actions.checkRegisterPassword(password, function (json) {
            str = json.data.value || "";
        }.bind(this), null, false);
        return str;
    },
    //createPasswordStrengthNode : function(){
    //    var passwordStrengthArea = this.formTableArea.getElement("[item='passwordStrengthArea']");
    //
    //    var lowNode = new Element( "div", {styles : this.css.passwordStrengthNode }).inject( passwordStrengthArea );
    //    this.lowColorNode = new Element( "div", {styles : this.css.passwordStrengthColor }).inject( lowNode );
    //    this.lowTextNode = new Element( "div", {styles : this.css.passwordStrengthText, text : this.lp.weak }).inject( lowNode );
    //
    //    var middleNode = new Element( "div" , {styles : this.css.passwordStrengthNode }).inject( passwordStrengthArea );
    //    this.middleColorNode = new Element( "div", {styles : this.css.passwordStrengthColor }).inject( middleNode );
    //    this.middleTextNode = new Element( "div", {styles : this.css.passwordStrengthText, text : this.lp.middle }).inject( middleNode );
    //
    //    var highNode = new Element("div", {styles : this.css.passwordStrengthNode }).inject( passwordStrengthArea );
    //    this.highColorNode = new Element( "div", {styles : this.css.passwordStrengthColor }).inject( highNode );
    //    this.highTextNode = new Element( "div", {styles : this.css.passwordStrengthText, text : this.lp.high }).inject( highNode );
    //},
    //getPasswordLevel: function( password ){
    //    /*Level（级别）
    //     •0-3 : [easy]
    //     •4-6 : [midium]
    //     •7-9 : [strong]
    //     •10-12 : [very strong]
    //     •>12 : [extremely strong]
    //     */
    //    var level = 0;
    //    this.actions.checkRegisterPassword( password, function( json ){
    //        level = json.data.value;
    //    }.bind(this), null, false );
    //    return level;
    //},
    //pwStrength: function(pwd){
    //    this.lowColorNode.setStyles( this.css.passwordStrengthColor );
    //    this.lowTextNode.setStyles( this.css.passwordStrengthText );
    //    this.middleColorNode.setStyles( this.css.passwordStrengthColor );
    //    this.middleTextNode.setStyles( this.css.passwordStrengthText );
    //    this.highColorNode.setStyles( this.css.passwordStrengthColor );
    //    this.highTextNode.setStyles( this.css.passwordStrengthText );
    //    if (!pwd){
    //    }else{
    //        //var level = this.checkStrong(pwd);
    //        var level = this.getPasswordLevel(pwd);
    //        switch(level) {
    //            case 0:
    //            case 1:
    //            case 2:
    //            case 3:
    //                this.lowColorNode.setStyles( this.css.passwordStrengthColor_low );
    //                this.lowTextNode.setStyles( this.css.passwordStrengthText_current );
    //                break;
    //            case 4:
    //            case 5:
    //            case 6:
    //                this.middleColorNode.setStyles( this.css.passwordStrengthColor_middle );
    //                this.middleTextNode.setStyles( this.css.passwordStrengthText_current );
    //                break;
    //            default:
    //                this.highColorNode.setStyles( this.css.passwordStrengthColor_high );
    //                this.highTextNode.setStyles( this.css.passwordStrengthText_current );
    //        }
    //    }
    //},
    gotoLogin: function () {
        this.explorer.openLoginForm({}, function () { window.location.reload(); });
        this.close();
    },
    gotoSignup: function () {
        this.explorer.openSignUpForm();
        this.close();
    }
});

//密码过期
MWF.xDesktop.Authentication.ChangePasswordForm = new Class({
    Extends: MPopupForm,
    Implements: [Options, Events],
    options: {
        "style": "default",
        "popupStyle": "o2platform",
        "width": "650",
        "height": "480",
        "hasTop": true,
        "hasIcon": false,
        "hasTopIcon": true,
        "hasTopContent": true,
        "hasBottom": false,
        "hasScroll": false,
        "hasMark": false,
        "title": "",
        "draggable": true,
        "closeAction": true,
        "userName" : ""
    },
    load: function () {
        if (!this.options.title) this.setOptions({
            "title": MWF.LP.authentication.ChangePasswordFormTitle
        });
        this._loadCss();
    },
    _createTableContent: function () {
        var self = this;

        if( this.formTopTextNode && this.formTopCloseActionNode ){
            this.formTopCloseActionNode.inject( this.formTopTextNode, "before" )
        }

        this.actions = MWF.Actions.get("x_organization_assemble_personal");

        var html = "<table width='100%' bordr='0' cellpadding='0' cellspacing='0' styles='formTable'>" +
            "<tr><td styles='formTableValueTop20'>" +
            "       <div style='position: relative;'><div item='password'></div><div class='inputPasswordIcon'></div></div>" +
            "</td></tr>" +
            "<tr><td styles='formTableValueTop20'>" +
            "       <div style='position: relative;'><div item='newPassword'></div><div class='inputPasswordIcon'></div></div>" +
            "</td>" +
            "<tr><td styles='formTableValue'><div item='passwordTip'></div></td></tr>" +
            "<tr><td styles='formTableValueTop20'>" +
            "       <div style='position: relative;'><div item='confirmPassword'></div><div class='inputComfirmPasswordIcon'></div></div>" +
            "</td></tr>" +
            "<tr><td styles='formTableValueTop20' item='submitAction'></td></tr>" +
            "<tr><td><div item='forgetPassword'></div><div item='gotoLoginAction'></div></td></tr>"+
            "<tr><td  styles='formTableValue' item='errorArea'></td></tr>" +
            "</table>";

        this.formTableArea.set("html", html);

        this.errorArea = this.formTableArea.getElement("[item=errorArea]");

        MWF.xDesktop.requireApp("Template", "MForm", function () {
            this.form = new MForm(this.formTableArea, this.data, {
                style: this.options.popupStyle,
                verifyType: "single",	//batch一起校验，或alert弹出
                isEdited: this.isEdited || this.isNew,
                onPostLoad: function () {
                    var form = this.form;
                    form.getItem("password").tipNode = this.errorArea;
                    form.getItem("newPassword").tipNode = this.errorArea;
                    form.getItem("confirmPassword").tipNode = this.errorArea;
                }.bind(this),
                itemTemplate: {
                    password: {
                        text: this.lp.oldPassword,
                        type: "password",
                        className: "inputPassword",
                        notEmpty: true,
                        defaultValueAsEmpty: false,
                        defaultValue: this.options.oldPassword || "",
                        emptyTip: this.lp.inputYourOldPassword,
                        attr: {"placeholder": this.lp.oldPassword},
                        event: {
                            focus: function (it) {
                                if ("password" === it.getValue()) it.setValue("");
                                if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputActive);
                            }.bind(this),
                            blur: function (it) {
                                // it.verify(true);
                                if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputPassword);
                            }.bind(this),
                            keyup: function (it, ev) {
                                if (ev.event.keyCode === 13) this.ok();
                            }.bind(this)
                        },
                        onEmpty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputEmpty);
                        }.bind(this),
                        onUnempty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputPassword);
                        }.bind(this)
                    },
                    newPassword: {
                        text: this.lp.newPassword,
                        type: "password",
                        className: "inputPassword",
                        notEmpty: true,
                        defaultValueAsEmpty: true,
                        emptyTip: this.lp.inputYourNewPassword,
                        attr: {"placeholder": this.lp.newPassword},
                        validRule: {
                            passwordIsWeak: function (value, it) {
                                return !this.getPasswordRule(it.getValue());
                            }.bind(this)
                        },
                        validMessage: {
                            passwordIsWeak: function () {
                                return self.getPasswordRule(this.getValue());
                            }
                        },
                        event: {
                            focus: function (it) {
                                if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputActive);
                            }.bind(this),
                            blur: function (it) {
                                // it.verify(true);
                            }.bind(this),
                            keyup: function (it, ev) {
                                if (ev.event.keyCode === 13)this.ok();
                            }.bind(this)
                        },
                        onEmpty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputEmpty);
                        }.bind(this),
                         onUnempty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputPassword);
                        }.bind(this)
                    },
                    confirmPassword: {
                        text: this.lp.confirmNewPassword,
                        type: "password",
                        className: "inputComfirmPassword",
                        notEmpty: true,
                        defaultValueAsEmpty: true,
                         emptyTip: this.lp.inputComfirmPassword,
                        attr: {"placeholder": this.lp.confirmPassword},
                        validRule: {
                            passwordNotEqual: function (value, it) {
                                if (it.getValue() === this.form.getItem("newPassword").getValue()) return true;
                            }.bind(this)
                        },
                        validMessage: {passwordNotEqual: this.lp.passwordNotEqual},
                        event: {
                            focus: function (it) {
                                if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputActive);
                            }.bind(this),
                            blur: function (it) {
                                // it.verify(true);
                                if (!it.warningStatus) it.getElements()[0].setStyles(this.css.inputComfirmPassword);
                            }.bind(this),
                            keyup: function (it, ev) {
                                if (ev.event.keyCode === 13)this.ok();
                            }.bind(this)
                        },
                        onEmpty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputEmpty);
                        }.bind(this),
                         onUnempty: function (it) {
                            it.getElements()[0].setStyles(this.css.inputComfirmPassword);
                        }.bind(this)
                    },

                    forgetPassword: {
                        value: this.lp.forgetPassword,
                        type: "innerText",
                        className: "forgetPassword",
                        event: {
                            click: function () {
                                this.gotoResetPassword();
                            }.bind(this)
                        }
                    },
                    gotoLoginAction: {
                        value: this.lp.loginAction,
                        type: "innerText",
                        className: "signUpAction",
                        event: {
                            click: function () { this.gotoLogin() }.bind(this)
                        }
                    },
                    passwordTip: {
                        type: "innerText",
                        className: "forgetPassword",
                        defaultValue: layout.config.passwordRegexHint || ""
                    },
                    submitAction: {
                        value: this.lp.submitAction,
                        type: "button",
                        className: "inputLogin",
                        event: {
                            click: function () {
                                this.ok();
                            }.bind(this)
                        }
                    }
                }
            }, this.app, this.css);
            this.form.load();
        }.bind(this), true);

    },
    gotoLogin: function () {
        this.explorer.openLoginForm({}, function () { window.location.reload(); });
        this.close();
    },
    getPasswordRule: function (password) {
        var str = "";
        this.actions.checkRegisterPassword(password, function (json) {
            str = json.data.value || "";
        }.bind(this), null, false);
        return str;
    },
    gotoResetPassword: function () {
        this.explorer.openResetPasswordForm();
        this.close();
    },
    ok: function () {
        this.fireEvent("queryOk");
        this.errorArea.empty();
        var data = this.form.getResult(true, ",", true, false, true);
        if (data) {
            this._ok(data, function (json) {
                if (json.type === "error") {
                    if (this.app) this.app.notice(json.message, "error");
                } else {

                    this._close();
                    if (this.formMaskNode) this.formMaskNode.destroy();
                    this.formAreaNode.destroy();
                    if (this.explorer && this.explorer.view) this.explorer.view.reload();
                    if (this.app) this.app.notice(this.lp.changePasswordSuccess, "success");
                    this.fireEvent("postOk", json);
                }
            }.bind(this));
        }
    },
    setWarning: function (text) {
        this.errorArea.empty();
        new Element("div", {
            "text": text,
            "styles": this.css.warningMessageNode
        }).inject(this.errorArea);
    },
    _ok: function (data, callback) {
        var d = {
            userName : this.options.userName,
            oldPassword : data.password,
            newPassword : data.newPassword,
            confirmPassword : data.confirmPassword
            //isEncrypted : "n" //是否启用加密,默认不加密,启用(y)。注意:使用加密先要在服务器运行 create encrypt key"
        }
        //o2.Actions.load("x_organization_assemble_personal").ResetAction.setPasswordAnonymous( d, function (json) {
        MWF.Actions.get("x_organization_assemble_personal").setPasswordAnonymous( d, function (json) {
            if (callback) callback(json);
            //this.fireEvent("postOk")
        }.bind(this), function (errorObj) {
            var error = JSON.parse(errorObj.responseText);
            this.setWarning(error.message);
        }.bind(this) )
    }
});

MWF.require("MWF.widget.Dialog", null, false);
MWF.xDesktop.Window = new Class({
	Extends: MWF.widget.Dialog,
	Implements: [Options, Events],
	options: {
		"style": "default",
		"title": "window",
		"width": "800",
		"height": "600",
		"top": "10",
		"left": "10",
		"fromTop": "0",
		"fromLeft": "0",
		"mark": false,

		"html": "",
		"text": "",
		"url": "",
		"content": null,

		"isMax": true,
		"isClose": true,
		"isResize": true,
		"isMove": true,
		
		"buttons": null,
		"buttonList": null
	},
	initialize: function(app, options){

		var position = layout.desktop.desktopNode.getPosition();
	//	var size = layout.desktop.desktopNode.getSize();
		
		this.options.top = parseFloat(this.options.top)+position.y;
		this.options.fromTop = parseFloat(this.options.fromTop)+position.y;
		
		this.app = app;
		this.parent(options);
		this.isHide = false;
		this.isMax = false;
	},
    // _loadCss: function(){
     //    if (this.app.windowCss){
	// 		this.css = this.app.windowCss;
     //    }else{
     //        var key = encodeURIComponent(this.cssPath);
     //        if (!reload && MWF.widget.css[key]){
     //            this.css = MWF.widget.css[key];
     //        }else{
     //            this.cssPath = (this.cssPath.indexOf("?")!=-1) ? this.cssPath+"&v="+COMMON.version : this.cssPath+"?v="+COMMON.version;
     //            var r = new Request.JSON({
     //                url: this.cssPath,
     //                secure: false,
     //                async: false,
     //                method: "get",
     //                noCache: false,
     //                onSuccess: function(responseJSON, responseText){
     //                    this.css = responseJSON;
     //                    MWF.widget.css[key] = responseJSON;
     //                }.bind(this),
     //                onError: function(text, error){
     //                    alert(error + text);
     //                }
     //            });
     //        }
     //    }
	// },
	changeStyle: function(){
        var obj = this.getNodeStyleStatus();
        this.cssPath = MWF.defaultPath+"/widget/$Dialog/"+this.options.style+"/css.wcss";
        this._loadCss();

        this.getContentUrl();
        var request = new Request.HTML({
            url: this.contentUrl,
            method: "GET",
            async: false,
            onSuccess: function(responseTree){
                var node = responseTree[0];
                var title = node.getElement(".MWF_dialod_title");
                var titleCenter = node.getElement(".MWF_dialod_title_center");
                var titleRefresh = node.getElement(".MWF_dialod_title_refresh");
                var titleText = node.getElement(".MWF_dialod_title_text");
                var titleAction = node.getElement(".MWF_dialod_title_action");
                var under = node.getElement(".MWF_dialod_under");
                var content = node.getElement(".MWF_dialod_content");
                var bottom = node.getElement(".MWF_dialod_bottom");
                var resizeNode = node.getElement(".MWF_dialod_bottom_resize");
                var button = node.getElement(".MWF_dialod_button");

                if (this.title && title){
                	this.title.clearStyles();
                	this.title.set("style", title.get("style"));
				}
                if (this.titleCenter && titleCenter){
                    this.titleCenter.clearStyles();
                    this.titleCenter.set("style", titleCenter.get("style"));
                }
                if (this.titleRefresh && titleRefresh){
                    this.titleRefresh.clearStyles();
                    this.titleRefresh.set("style", titleRefresh.get("style"));
                }
                if (this.titleText && titleText){
                    this.titleText.clearStyles();
                    this.titleText.set("style", titleText.get("style"));
                }
                if (this.titleAction && titleAction){
                    this.titleAction.clearStyles();
                    this.titleAction.set("style", titleAction.get("style"));
                }
                if (this.under && under){
                    this.under.clearStyles();
                    this.under.set("style", under.get("style"));
                }
                if (this.content && content){
                    this.content.clearStyles();
                    this.content.set("style", content.get("style"));
                }
                if (this.bottom && bottom){
                    this.bottom.clearStyles();
                    this.bottom.set("style", bottom.get("style"));
                }
                if (this.resizeNode && resizeNode){
                    this.resizeNode.clearStyles();
                    this.resizeNode.set("style", resizeNode.get("style"));
                }
                if (this.button && button){
                    this.button.clearStyles();
                    this.button.set("style", button.get("style"));
                }


                this.setNodeStyleStatus(obj);

                this.node.setStyles(this.css.to);
                this.spacer.setStyles(this.css.spacerTo);

                if (this.closeActionNode) this.closeActionNode.setStyles(this.css.closeActionNode);
                if (this.maxActionNode) this.maxActionNode.setStyles(this.css.maxActionNode);
                if (this.minActionNode) this.minActionNode.setStyles(this.css.minActionNode);
                if (this.restoreActionNode) this.restoreActionNode.setStyles(this.css.restoreActionNode);

                if (this.app == this.app.desktop.currentApp){
                    this.node.setStyles(this.css.current);
                    this.spacer.setStyles(this.css.spacerCurrent);
                }else{
                    this.node.setStyles(this.css.uncurrent);
                    this.spacer.setStyles(this.css.spacerUncurrent);
                }

                this.setContentSize();


            }.bind(this)
        });
        request.send();



	},
	setNodeStyleStatus: function(obj){
		this.css.to.height = obj.nodeTo.height;
		this.css.to.width = obj.nodeTo.width;
		this.css.to.top = obj.nodeTo.top;
		this.css.to.left = obj.nodeTo.left;
		this.css.to["z-index"] = obj.nodeTo["z-index"];
		
		this.css.from.top = obj.nodeFrom.top;
		this.css.from.left = obj.nodeFrom.left;
		this.css.from["z-index"] = obj.nodeFrom["z-index"];
		
		this.css.spacerTo.height = obj.spacerTo.height;
		this.css.spacerTo.width = obj.spacerTo.width;
		this.css.spacerTo.top = obj.spacerTo.top;
		this.css.spacerTo.left = obj.spacerTo.left;
		this.css.spacerTo["z-index"] = obj.spacerTo["z-index"];
		
		this.css.spacerFrom.top = obj.spacerFrom.top;
		this.css.spacerFrom.left = obj.spacerFrom.left;
		this.css.spacerFrom["z-index"] = obj.spacerFrom["z-index"];
	},
	
	getNodeStyleStatus: function(){
		return {
			"nodeTo": {
				"height": this.css.to.height,
				"width": this.css.to.width,
				"top": this.css.to.top,
				"left": this.css.to.left,
				"z-index": this.css.to["z-index"]
			},
			"nodeFrom": {
				"top": this.css.from.top,
				"left": this.css.from.left,
				"z-index": this.css.from["z-index"]
			},
			"spacerTo": {
				"height": this.css.spacerTo.height,
				"width": this.css.spacerTo.width,
				"top": this.css.spacerTo.top,
				"left": this.css.spacerTo.left,
				"z-index": this.css.spacerTo["z-index"]
			},
			"spacerFrom": {
				"top": this.css.spacerFrom.top,
				"left": this.css.spacerFrom.left,
				"z-index": this.css.spacerFrom["z-index"]
			}
		};
	},
	reStyle: function(options){
		if (options) this.setOptions(options);
		
		var index = null;
		if (MWF.xDesktop.zIndexPool) index = MWF.xDesktop.zIndexPool.applyZindex();

		this.css.to.height = this.options.height+"px";
		this.css.to.width = this.options.width+"px";
		this.css.to.top = this.options.top+"px";
		this.css.to.left = this.options.left+"px";
	//	this.css.to.top = this.options.top+"px";
		this.css.from.top = this.options.fromTop+"px";
		this.css.from.left = this.options.fromLeft+"px";
		if (index){
			this.css.from["z-index"] = index+1;
			this.css.to["z-index"] = index+1;
		}
		if (this.node) this.node.set("styles", this.css.from);
		
		this.css.spacerTo.height = this.options.height+"px";
		this.css.spacerTo.width = this.options.width+"px";
		this.css.spacerTo.top = this.options.top+"px";
		this.css.spacerTo.left = this.options.left+"px";
	//	this.css.spacerTo.top = this.options.top+"px";
		this.css.spacerFrom.top = this.options.fromTop+"px";
		this.css.spacerFrom.left = this.options.fromLeft+"px";
		if (index){
			this.css.spacerFrom["z-index"] = index;
			this.css.spacerTo["z-index"] = index;
		}
		if (this.spacer) this.spacer.set("styles", this.css.spacerFrom);
	},
	
	setCurrent: function(){
		if (MWF.xDesktop.zIndexPool){
			var index = this.node.getStyle("z-index").toFloat()+1;
			if (index < MWF.xDesktop.zIndexPool.zIndex){
				var newIndex = MWF.xDesktop.zIndexPool.applyZindex();
				
				this.css.spacerTo["z-index"] = newIndex;
				this.css.spacerFrom["z-index"] = newIndex;
				
//				if(this.spacerMorph){
//					if (this.spacerMorph.isRunning()){
//						this.spacerMorph.chain(function(){
//							if (this.spacer) this.spacer.setStyle("z-index", newIndex);
//						}.bind(this));
//					}else{
						if (this.spacer) this.spacer.setStyle("z-index", newIndex);
//					}
//				}

				this.css.to["z-index"] = newIndex+1;
				this.css.from["z-index"] = newIndex+1;
				
//				if(this.morph){
//					if (this.morph.isRunning()){
//						this.morph.chain(function(){
//							this.node.setStyle("z-index", newIndex+1);
//						}.bind(this));
//					}else{
						this.node.setStyle("z-index", newIndex+1);
//					}
//				}
			}
		}
		this.node.setStyles(this.css.current);
		if (this.spacer) this.spacer.setStyles(this.css.spacerCurrent);
	},
	setUncurrent: function(){
		this.node.setStyles(this.css.uncurrent);
		if (this.spacer) this.spacer.setStyles(this.css.spacerUncurrent);
	},
	setTitleEvent: function(){
		this.node.addEvent("mousedown", function(){
			this.app.setCurrent();
		}.bind(this));

        this.containerDrag = new Drag(this.title, {
            "handle": this.title,
            "onStart": function(el, e){
                this.containerDrag.stop();
                var div = this.node.clone(false).inject($(document.body));
                var size = this.node.getSize();
                div.setStyles({
                    "opacity": 0.7,
                    "border": "2px dashed #999",
                    "z-index": this.node.getStyle("z-index"),
                    "width": size.x,
                    "height": size.y,
                    "background-color": "#CCC",
                    "position": "absolute"
                });
                div.position({
                    relativeTo: this.node,
                    position: 'upperLeft',
                    edge: 'upperLeft'
                });

                var drag = new Drag.Move(div, {
                    "onStart": function(){
                        //this.node.setStyle("display", "none");
                        this.node.fade("out");
                        this.spacer.fade("out");
                    }.bind(this),
                    "onDrop": function(dragging, inObj, e){
                        
                        this.node.fade("in");
                        this.spacer.fade(this.css.spacerTo.opacity);
                        this.node.position({
                            relativeTo: dragging,
                            position: 'upperLeft',
                            edge: 'upperLeft'
                        });
                        var p = this.node.getPosition();
                        this.spacer.setStyles({
                            "top": p.y,
                            "left": p.x
                        });
                        this.css.spacerTo.left = p.x;
                        this.css.spacerTo.top = p.y;
                        this.css.to.left = p.x;
                        this.css.to.top = p.y;
                        dragging.destroy();
                        this.fireEvent("moveDrop", [e]);
                    }.bind(this),
                    "onCancel": function(dragging){
                        dragging.destroy();
                        drag = null;
                    }
                });
                drag.start(e);
            }.bind(this)
        });



        //this.title.addEvent("mousedown", function(e){
        //}.bind(this));

        //this.containerDrag = new Drag.Move(this.node, {
        //    "limit": {"x": [null, null], "y": [0, null]},
        //    "handle": this.title,
        //    "onDrag": function(){
        //        var p = this.node.getPosition();
        //        if (this.spacer){
        //            this.spacer.setStyles({
        //                "top": p.y,
        //                "left": p.x
        //            });
        //            this.css.spacerTo.left = p.x;
        //            this.css.spacerTo.top = p.y;
        //        };
        //        this.css.to.left = p.x;
        //        this.css.to.top = p.y;
        //    }.bind(this)
        //});
		
		if (this.options.isResize){
			this.node.makeResizable({
				"handle": this.resizeNode || this.bottom,
				"limit": {x:[200, null], y:[200, null]},
				"onDrag": function(){
					var size = this.node.getComputedSize();
					
					if (this.spacer){
						this.spacer.setStyles({
							"width": size.width,
							"height": size.height
						});
						this.css.spacerTo.width = size.width;
						this.css.spacerTo.height = size.height;
					}
					this.css.to.width = size.width;
					this.css.to.height = size.height;
	
					this.setContentSize(size.height, size.width);
					
					this.fireEvent("resize");
				}.bind(this),
                "onComplete": function(){
                    this.fireEvent("resizeCompleted");
                }.bind(this)
			});
		}
	},
	getContentUrl: function(){
		if (layout.desktop.windowCss){
            this.contentUrl = MWF.defaultPath+"/xDesktop/$Window/desktop_default/dialog.html";
		}else{
            this.contentUrl = MWF.defaultPath+"/xDesktop/$Window/"+this.options.style+"/dialog.html";
		}

	},
	
	_loadCss: function(){
        if (this.app.desktop.windowCss){
            this.css = this.app.desktop.windowCss;
        }else{
            this.path = MWF.defaultPath+"/xDesktop/$Window/";
            this.cssPath = MWF.defaultPath+"/xDesktop/$Window/"+this.options.style+"/css.wcss";

            var r = new Request.JSON({
                url: this.cssPath,
                secure: false,
                async: false,
                method: "get",
                noCache: true,
                onSuccess: function(responseJSON, responseText){
                    this.css = responseJSON;
                }.bind(this),
                onError: function(text, error){
                    alert(text);
                }
            });
            r.send();
        }
	},
	getSpacer: function(){
		if (!this.spacer){
			this.spacer = new Element("div", {
				styles: this.css.spacerFrom
			}).inject(this.options.container || $(document.body));
		}
	},
    showNoAnimation: function(max, hide){
        if (max){
            this.showMaxIm();
        }else if (hide){
            this.showIm();
            this.hideIm();
        }else{
            this.showIm();
        }
    },
    showMaxIm: function(callback){
        this.querySetMaxStyle();
        this.getSpacer();
        this.spacer.setStyle("display", "block");
        this.node.setStyle("display", "block");

        var size = this.getMaxSize();

        var spacerTo = Object.clone(this.css.spacerTo);
        var to = Object.clone(this.css.to);
        var contentTo = {};

        spacerTo.top = size.position.y;
        spacerTo.left = size.position.x;
        spacerTo.width = size.spacer.x;
        spacerTo.height = size.spacer.y;

        to.top = size.position.y;
        to.left = size.position.x;
        to.width = size.node.x;
        to.height = size.node.y;

        contentTo = size.contentSize;

        if (this.fireEvent("queryShow")){
            this.fireEvent("queryMax");
            this.node.setStyles(to);
            this.spacer.setStyles(spacerTo);
            this.content.setStyles(contentTo);

            if (this.titleText) this.getTitle();
            this.isMax = true;
            this.isHide = false;
            if (this.containerDrag) this.containerDrag.detach();

            this.postSetMaxStyle();

            if (callback) callback();
            this.fireEvent("postShow");
            this.fireEvent("postMax");
            if (this.maxActionNode) this.maxActionNode.setStyles(this.css.restoreActionNode);
        }
    },
    showIm: function(){
        if (this.options.mark) this._markShow();
        this.getSpacer();
        this.spacer.setStyle("display", "block");
        this.node.setStyle("display", "block");
        var contentSize = this.getContentSize(this.css.to.height.toFloat(), this.css.to.width.toFloat());

        if (this.fireEvent("queryShow")){

            this.spacer.setStyles(this.css.spacerTo);
            if (this.app.desktop.currentApp!=this.app) this.spacer.setStyles(this.css.spacerUncurrent);
            this.content.setStyles(contentSize);
            this.node.setStyles(this.css.to);

            if (this.titleText) this.getTitle();
            this.isHide = false;
            if (this.containerDrag) this.containerDrag.attach();
            this.fireEvent("postShow");
        }
    },
	show: function(){
		if (this.options.mark) this._markShow();
		if (!this.morph){
			this.morph = new Fx.Morph(this.node, {duration: 100, link: "chain"});
		}
		this.morph.setOptions({duration: 50});

		this.getSpacer();
		if (!this.spacerMorph){
			this.spacerMorph = new Fx.Morph(this.spacer, {duration: 100, link: "chain"});
		}
		this.spacerMorph.setOptions({duration: 50});
		
		if (!this.contentMorph){
			this.contentMorph = new Fx.Morph(this.content, {duration: 50, link: "chain"});
		}
		this.contentMorph.setOptions({duration: 50});
		
		this.spacer.setStyle("display", "block");
		this.node.setStyle("display", "block");
		
		var contentSize = this.getContentSize(this.css.to.height.toFloat(), this.css.to.width.toFloat());

		if (this.fireEvent("queryShow")){
			var nodeFinish = false;
			var spacerFinish = false;
			var contentFinish = false;
			
			this.spacerMorph.start(this.css.spacerTo).chain(function(){
				if (this.app.desktop.currentApp!=this.app) this.spacer.setStyles(this.css.spacerUncurrent);
				spacerFinish = true;
				firePost();
			}.bind(this));

			this.contentMorph.start(contentSize).chain(function(){
				contentFinish = true;
				firePost();
			}.bind(this));

			this.morph.start(this.css.to).chain(function(){
				nodeFinish = true;
				firePost();
			}.bind(this));
			
			var firePost = function(){
				if (nodeFinish && spacerFinish && contentFinish){
					if (this.titleText) this.getTitle();
					this.isHide = false;
					if (this.containerDrag) this.containerDrag.attach();
					this.fireEvent("postShow");

//					if (this.isMax){
//						this.isMax = false;
//						this.app.maxSize();
//					}
				} 
			}.bind(this);
		}
	},
	restore: function(callback){
		this.querySetRestoreStyle();
		if (this.options.mark) this._markShow();
		if (!this.morph){
			this.morph = new Fx.Morph(this.node, {duration: 100, link: "chain"});
		}
		this.morph.setOptions({duration: 50});
		this.getSpacer();
		if (!this.spacerMorph){
			this.spacerMorph = new Fx.Morph(this.spacer, {duration: 100, link: "chain"});
		}
		this.spacerMorph.setOptions({duration: 50});
		
		if (!this.contentMorph){
			this.contentMorph = new Fx.Morph(this.content, {duration: 50, link: "chain"});
		}
		this.contentMorph.setOptions({duration: 50});
		this.spacer.setStyle("display", "block");
		this.node.setStyle("display", "block");
		
		var contentSize = this.getContentSize(this.css.to.height.toFloat(), this.css.to.width.toFloat());
		
		if (this.fireEvent("queryRestore")){
			var nodeFinish = false;
			var spacerFinish = false;
			var contentFinish = false;
			
			this.spacerMorph.start(this.css.spacerTo).chain(function(){
				if (this.app.desktop.currentApp!=this.app) this.spacer.setStyles(this.css.spacerUncurrent);
				spacerFinish = true;
				firePost();
			}.bind(this));
			this.contentMorph.start(contentSize).chain(function(){
				contentFinish = true;
				firePost();
			}.bind(this));

			this.morph.start(this.css.to).chain(function(){
				if (this.app.desktop.currentApp!=this.app) this.node.setStyles(this.css.uncurrent);
				nodeFinish = true;
				firePost();
			}.bind(this));
			
			var firePost = function(){
				if (nodeFinish && spacerFinish && contentFinish){
					if (this.titleText) this.getTitle();
					this.isHide = false;
					this.isMax = false;
					if (this.containerDrag) this.containerDrag.attach();
                    this.postSetRestoreStyle();
					if (callback) callback();
					this.fireEvent("resize");
					this.fireEvent("postRestore");
				}
			}.bind(this);
			if (this.maxActionNode) this.maxActionNode.setStyles(this.css.maxActionNode);
		}
	},

    querySetRestoreStyle: function(){
        if (this.css.windowTitleRestore) this.title.setStyles(this.css.windowTitleRestore);
        if (this.css.titleRefresh) this.titleRefresh.setStyles(this.css.titleRefresh);
        if (this.css.windowTitleTextRestore) this.titleText.setStyles(this.css.windowTitleTextRestore);
        if (this.css.windowTitleActionRestore) this.titleAction.setStyles(this.css.windowTitleActionRestore);

        if (this.closeActionNode){
            if (this.css.closeActionNode) this.closeActionNode.setStyles(this.css.closeActionNode);
        }
        if (this.maxActionNode){
            if (this.css.maxActionNode) this.maxActionNode.setStyles(this.css.maxActionNode);
        }
        if (this.minActionNode){
            if (this.css.minActionNode) this.minActionNode.setStyles(this.css.minActionNode);
        }
    },
    postSetRestoreStyle: function(){
        if (this.css.windowNodeRestore) this.node.setStyles(this.css.windowNodeRestore);
    },
	restoreIm: function(callback){
        this.querySetRestoreStyle();
		this.getSpacer();
	
		this.spacer.setStyle("display", "block");
		this.node.setStyle("display", "block");
		var contentSize = this.getContentSize(this.css.to.height.toFloat(), this.css.to.width.toFloat());
		
		if (this.fireEvent("queryRestore")){
			this.node.setStyles(this.css.to);
			this.spacer.setStyles(this.css.spacerTo);
			this.content.setStyles(contentSize);
			
			if (this.titleText) this.getTitle();
			this.isHide = false;
			this.isMax = false;
			if (this.containerDrag) this.containerDrag.attach();
			this.postSetRestoreStyle();
			if (callback) callback();
			this.fireEvent("resize");
			this.fireEvent("postRestore");

			if (this.maxActionNode) this.maxActionNode.setStyles(this.css.maxActionNode);
		}
	},
    hideIm: function(x, y, callback) {
        this.getSpacer();
        if (x){
            this.css.from.left = x;
            this.css.spacerFrom.left = x;
        }
        if (y){
            this.css.from.top = y;
            this.css.spacerFrom.top = y;
        }

        if (this.fireEvent("queryHide")){
            if (this.titleText) this.titleText.set("text", "");
            if (this.button) this.button.set("html", "");

            this.spacer.setStyles(this.css.spacerFrom);

            this.node.setStyles(this.css.from);

            this._markHide();
            this.isHide = true;
            this.node.setStyle("display", "none");
            this.spacer.setStyle("display", "none");
            if (callback) callback();
            this.fireEvent("postHide");
        }
    },
	hide: function(x, y, callback) {
		if (!this.morph){
			this.morph = new Fx.Morph(this.node, {duration: 100, link: "chain"});
		}
		this.morph.setOptions({duration: 100});
		
		this.getSpacer();
		if (!this.spacerMorph){
			this.spacerMorph = new Fx.Morph(this.spacer, {duration: 100, link: "chain"});
		}
		this.spacerMorph.setOptions({duration: 100});
		
		if (x){
			this.css.from.left = x;
			this.css.spacerFrom.left = x;
		} 
		if (y){
			this.css.from.top = y;
			this.css.spacerFrom.top = y;
		} 
		
		if (this.fireEvent("queryHide")){
			if (this.titleText) this.titleText.set("text", "");
			if (this.button) this.button.set("html", "");
					
			var nodeFinish = false;
			var spacerFinish = false;
			
			this.spacerMorph.start(this.css.spacerFrom).chain(function(){
				spacerFinish = true;
				firePost();
			}.bind(this));

			this.morph.start(this.css.from).chain(function(){
				nodeFinish = true;
				firePost();
			}.bind(this));
			
			var firePost = function(){
				if (nodeFinish && spacerFinish){
					this._markHide();
					this.isHide = true;
					this.node.setStyle("display", "none");
					this.spacer.setStyle("display", "none");
					if (callback) callback();
					this.fireEvent("postHide");
				}
			}.bind(this);
		}
	},
	_hideIm: function(){
		this.node.setStyle("display", "none");
		this.spacer.setStyle("display", "none");
	},
	_showIm: function(){
		this.node.setStyle("display", "block");
		this.spacer.setStyle("display", "block");
	},
	_fadeOut: function(){
		this.node.fade("out");
		this.spacer.fade("out");
	},
	_fadeIn: function(){
		this.node.fade("in");
		this.spacer.fade("in");
	},
	
	close: function(callback){
		if (!this.morph){
			this.morph = new Fx.Morph(this.node, {duration: 100, link: "chain"});
		}
		this.morph.setOptions({duration: 100});
		this.getSpacer();
		if (!this.spacerMorph){
			this.spacerMorph = new Fx.Morph(this.spacer, {duration: 100, link: "chain"});
		}
		this.spacerMorph.setOptions({duration: 100});
		
		if (this.fireEvent("queryClose")){
			//this.spacerMorph.start(this.css.spacerFrom).chain(function(){
			//	this.spacer.destroy();
			//	this.spacer = null;
			//}.bind(this));
            //
			//this.morph.start(this.css.from).chain(function(){
			//	this._markHide();
			//	this.node.destroy();
			//	this.node = null;
			//	if (callback) callback();
			//	this.fireEvent("postClose");
			//}.bind(this));

            this.spacer.destroy();
            this.spacer = null;

            this._markHide();
            this.node.destroy();
            this.node = null;
            if (callback) callback();
            this.fireEvent("postClose");
			o2.release(this);
		}
	},
	getAction: function(){
		this.titleAction.setStyles(this.css.titleAction);
		var _self = this;
		this.closeActionNode = new Element("div", {
			"styles": this.css.closeActionNode,
			"events": {
				"mouseover": function(e){this.setStyles(_self.css.titleActionOver);e.stopPropagation();},
				"mouseout": function(e){this.setStyles(_self.css.titleActionOut);e.stopPropagation();},
				"mousedown": function(e){this.setStyles(_self.css.titleActionDown);e.stopPropagation();},
				"mouseup": function(e){this.setStyles(_self.css.titleActionOver);e.stopPropagation();},
				"click": function(e){
					this.app.close();
                    e.stopPropagation();
				}.bind(this)
			}
		}).inject(this.titleAction);
		
		if (this.options.isMax!=false){
			this.maxActionNode = new Element("div", {
				"styles": this.css.maxActionNode,
				"events": {
					"mouseover": function(){this.setStyles(_self.css.titleActionOver);},
					"mouseout": function(){this.setStyles(_self.css.titleActionOut);},
					"mousedown": function(){this.setStyles(_self.css.titleActionDown);},
					"mouseup": function(){this.setStyles(_self.css.titleActionOver);},
					"click": function(){
						this.app.maxOrRestoreSize();
					}.bind(this)
				}
			}).inject(this.titleAction);
		}
		if (this.options.isResize){
            this.title.addEvent("dblclick", this.app.maxOrRestoreSize.bind(this.app));
		}
		
		this.minActionNode = new Element("div", {
			"styles": this.css.minActionNode,
			"events": {
				"mouseover": function(){this.setStyles(_self.css.titleActionOver);},
				"mouseout": function(){this.setStyles(_self.css.titleActionOut);},
				"mousedown": function(){this.setStyles(_self.css.titleActionDown);},
				"mouseup": function(){this.setStyles(_self.css.titleActionOver);},
				"click": function(){
					this.app.minSize();
				}.bind(this)
			}
		}).inject(this.titleAction);

        if (this.options.isRefresh!=false){
            this.titleRefresh.addEvents({
                "mouseover": function(){this.setStyles(_self.css.titleActionOver);},
                "mouseout": function(){this.setStyles(_self.css.titleActionOut);},
                "mousedown": function(){this.setStyles(_self.css.titleActionDown);},
                "mouseup": function(){this.setStyles(_self.css.titleActionOver);},
                "click": function(e){
                    this.app.refresh();
                }.bind(this),
                "dblclick": function(e){
                    e.stopPropagation();
                }.bind(this)
            });
        }
	},
	maxOrRestoreSize: function(callback){
		if (this.isMax){
			this.restoreSize(callback);
		}else{
			this.maxSize(callback);
		}
	},
	restoreSize: function(callback){
		this.restore(callback);
	},
	maxSize: function(callback){
        this.querySetMaxStyle();

		if (!this.morph){
			this.morph = new Fx.Morph(this.node, {duration: 50, link: "chain"});
		}
		this.morph.setOptions({duration: 50});
		
		this.getSpacer();
		if (!this.spacerMorph){
			this.spacerMorph = new Fx.Morph(this.spacer, {duration: 50, link: "chain"});
		}
		this.spacerMorph.setOptions({duration: 50});
		
		if (!this.contentMorph){
			this.contentMorph = new Fx.Morph(this.content, {duration: 50, link: "chain"});
		}
		this.contentMorph.setOptions({duration: 50});
		
		this.spacer.setStyle("display", "block");
		this.node.setStyle("display", "block");
		
		var size = this.getMaxSize();
		
		var spacerTo = Object.clone(this.css.spacerTo);
		var to = Object.clone(this.css.to);
		var contentTo = {};
		
		spacerTo.top = size.position.y;
		spacerTo.left = size.position.x;
		spacerTo.width = size.spacer.x;
		spacerTo.height = size.spacer.y;
		
		to.top = size.position.y;
		to.left = size.position.x;
		to.width = size.node.x;
		to.height = size.node.y;

		contentTo = size.contentSize;

		if (this.fireEvent("queryMax")){
			var nodeFinish = false;
			var spacerFinish = false;
			var contentFinish = false;
			
			this.spacerMorph.start(spacerTo).chain(function(){
				if (this.app.desktop.currentApp!=this.app) this.spacer.setStyles(this.css.spacerUncurrent);
				spacerFinish = true;
				firePost();
			}.bind(this));
			this.contentMorph.start(contentTo).chain(function(){
				contentFinish = true;
				firePost();
			}.bind(this));

			this.morph.start(to).chain(function(){
				if (this.app.desktop.currentApp!=this.app) this.node.setStyles(this.css.uncurrent);
				nodeFinish = true;
				firePost();
			}.bind(this));
			
			var firePost = function(){
				if (nodeFinish && spacerFinish && contentFinish){
					if (this.titleText) this.getTitle();
					this.isMax = true;
					this.isHide = false;
					if (this.containerDrag) this.containerDrag.detach();

                    this.postSetMaxStyle();

					if (callback) callback();
					this.fireEvent("resize");
					this.fireEvent("postMax");
				}
			}.bind(this);
			
			if (this.maxActionNode) this.maxActionNode.setStyles(this.css.restoreActionNode);
		}
	},
    querySetMaxStyle: function(){
	    if (this.css.windowTitleMax) this.title.setStyles(this.css.windowTitleMax);
        if (this.css.windowTitleRefreshMax) this.titleRefresh.setStyles(this.css.windowTitleRefreshMax);
        if (this.css.windowTitleTextMax) this.titleText.setStyles(this.css.windowTitleTextMax);
        if (this.css.windowTitleActionMax) this.titleAction.setStyles(this.css.windowTitleActionMax);

        if (this.closeActionNode){
            if (this.css.windowActionNodeMax) this.closeActionNode.setStyles(this.css.windowActionNodeMax);
        }
        if (this.maxActionNode){
            if (this.css.windowActionNodeMax) this.maxActionNode.setStyles(this.css.windowActionNodeMax);
        }
        if (this.minActionNode){
            if (this.css.windowActionNodeMax) this.minActionNode.setStyles(this.css.windowActionNodeMax);
        }
	},
    postSetMaxStyle: function(){
        if (this.css.windowNodeMax) this.node.setStyles(this.css.windowNodeMax);
    },
	maxSizeIm: function(callback){
        this.querySetMaxStyle();

		this.getSpacer();
		this.spacer.setStyle("display", "block");
		this.node.setStyle("display", "block");
		
		var size = this.getMaxSize();
		
		var spacerTo = Object.clone(this.css.spacerTo);
		var to = Object.clone(this.css.to);
		var contentTo = {};
		
		spacerTo.top = size.position.y;
		spacerTo.left = size.position.x;
		spacerTo.width = size.spacer.x;
		spacerTo.height = size.spacer.y;
		
		to.top = size.position.y;
		to.left = size.position.x;
		to.width = size.node.x;
		to.height = size.node.y;
		
		contentTo = size.contentSize;

		if (this.fireEvent("queryMax")){
			this.node.setStyles(to);
			this.spacer.setStyles(spacerTo);
			this.content.setStyles(contentTo);
			
			if (this.titleText) this.getTitle();
			this.isMax = true;
			this.isHide = false;
			if (this.containerDrag) this.containerDrag.detach();

            this.postSetMaxStyle();

			if (callback) callback();
			this.fireEvent("resize");
			this.fireEvent("postMax");

			if (this.maxActionNode) this.maxActionNode.setStyles(this.css.restoreActionNode);
		}
	},
	getMaxSize: function(){
		var size = layout.desktop.desktopNode.getSize();
		var position = layout.desktop.desktopNode.getPosition();
		
		var pt = this.spacer.getStyle("padding-top").toFloat();
		var pb = this.spacer.getStyle("padding-bottom").toFloat();
		var pl = this.spacer.getStyle("padding-left").toFloat();
		var pr = this.spacer.getStyle("padding-right").toFloat();
		spacerHeight = size.y-pt-pb;
		spacerWidth = size.x-pl-pr;
		
		pt = this.node.getStyle("padding-top").toFloat();
		pb = this.node.getStyle("padding-bottom").toFloat();
		pl = this.node.getStyle("padding-left").toFloat();
		pr = this.node.getStyle("padding-right").toFloat();
		nodeHeight = size.y-pt-pb;
		nodeWidth = size.x-pl-pr;
		
		var contentSize = this.getContentSize(nodeHeight, nodeWidth);
		
		return {"node": {"x": nodeWidth, "y": nodeHeight}, "spacer": {"x": spacerWidth, "y": spacerHeight}, "position": {"x": position.x, "y": position.y}, "contentSize": contentSize};
	}
});
MWF.xDesktop.WindowTransparent = new Class({
    Implements: [Options, Events],
    options: {
        "style": "default"
    },
    initialize: function(app, options){
        this.setOptions(options);
        var position = layout.desktop.desktopNode.getPosition();
        this.app = app;

        this.fireEvent("queryLoad");
        this.isMax = false;
        this.isHide = false;
        this.css = {
            "to": {"width": "0", "height": "0", "left": "0", "top": "0"}
        };

        var index = null;
        if (MWF.xDesktop.zIndexPool) index = MWF.xDesktop.zIndexPool.applyZindex();
        this.node = new Element("div", {
            "styles":{
                "width": "0px",
                "height": "0px",
                "top": "0px",
                "left": "0px",
                "position": "absolute",
                "z-index": (index)? index : 100
            }
        }).inject(this.options.container || $(document.body));
        this.content = new Element("div", {
            "styles": {"width": "100%", "height": "100%"}
        }).inject(this.node);
        this.fireEvent("postLoad");
    },
    show: function(){
        this.fireEvent("queryShow");
        this.node.setStyle("display", "block");
        this.isHide = false;
        this.fireEvent("postShow");
    },
    hide: function(){
        this.fireEvent("queryHide");
        this.node.setStyle("display", "none");
        this.isHide = true;
        this.fireEvent("postHide");
    },
    restore: function(callback) {
        this.fireEvent("queryRestore");
        this.node.setStyle("display", "block");
        this.isHide = false;
        this.fireEvent("postRestore");
        if (callback) callback();
    },
    restoreSize: function(callback){
        this.restore(callback);
    },
    close: function(callback){
        this.fireEvent("queryClose");
        this.node.destroy();
        this.node = null;
        this.content = null;
        delete this;
        if (callback) callback();
        this.fireEvent("postClose");
    },
    maxOrRestoreSize: function(callback){
        if (this.isMax){
            this.restoreSize(callback);
        }else{
            this.maxSize(callback);
        }
    },
    maxSize: function(callback){
        this.fireEvent("queryMax");
        this.node.setStyle("display", "block");
        this.isHide = false;
        this.fireEvent("resize");
        this.fireEvent("postMax");
        if (callback) callback();
    },
    restoreIm: function(){
        this.restore();
    },
    maxSizeIm: function(){
        this.maxSize();
    },
    setCurrent: function(){
        if (MWF.xDesktop.zIndexPool){
            var index = this.node.getStyle("z-index").toFloat()+1;
            if (index < MWF.xDesktop.zIndexPool.zIndex){
                var newIndex = MWF.xDesktop.zIndexPool.applyZindex();
                this.node.setStyle("z-index", newIndex);
            }
        }
    },
    _fadeOut: function(){
        this.node.fade("out");
        if (this.spacer) this.spacer.fade("out");
    },
    _fadeIn: function(){
        this.node.fade("in");
        if (this.spacer) this.spacer.fade("in");
    },
    setUncurrent: function(){},
    reStyle: function(){},
    changeStyle: function(){}
});
MWF.xApplication.Common = MWF.xApplication.Common || {
	options: {
		"multitask": false,	//允许多窗口运行
		"executable": true	//可执行
	}
};
MWF.require("MWF.xDesktop.Window", null, false);

(function () {
	var removeOn = function (string) {
		return string.replace(/^on([A-Z])/, function (full, first) {
			return first.toLowerCase();
		});
	};
	Events.implement({
		"fireEvent": function (type, args, delay) {
			if (this.options && this.options.name && MWF.xDesktop && MWF.xDesktop.$globalEvents) {
				if (MWF.xDesktop.$globalEvents[this.options.name]) {
					var evs = MWF.xDesktop.$globalEvents[this.options.name][type];
					if (evs) {
						evs.each(function (fn) {
							if (delay) fn.delay(delay, this, args);
							else fn.apply(this, args);
						}, this);
					}
				}
				if (MWF.xDesktop.$globalEvents['$all']) {
					var evs = MWF.xDesktop.$globalEvents['$all'][type];
					if (evs) {
						evs.each(function (fn) {
							if (delay) fn.delay(delay, this, args);
							else fn.apply(this, args);
						}, this);
					}
				}
			}

			type = removeOn(type);
			var events = this.$events[type];
			if (!events) return this;
			args = Array.convert(args);
			events.each(function (fn) {
				if (delay) fn.delay(delay, this, args);
				else fn.apply(this, args);
			}, this);
			return this;
		}
	});
})();

MWF.xApplication.Common.Main = new Class({
	Extends: MWF.widget.Common,
	Implements: [Options, Events],

	options: {
		"desktopReload": true,
		"style": "default",
		"name": "Common",
		"icon": "", //图标
		"title": "", //标题
		"event": null,
		"width": "800",
		"height": "600",
		"isResize": true,
		"isMax": true,
		"setCurrent": true,
		"isRefresh": false,
		"isWindowRefresh": true,
		"embededParent": ""
	},
	initialize: function (desktop, options) {
		this.setOptions(options);
		this.desktop = desktop;

		this.path = "../x_component_" + this.options.name.replace(/\./g, "_") + "/$Main/";
		this.options.icon = this.path + this.options.style + "/" + this.options.icon;

		this.cssPath = this.path + this.options.style + "/css.wcss";
		if (this.options.mvcStyle) this.stylePath = this.path + this.options.style + "/" + this.options.mvcStyle;
		if (!this.options.mvcStyle) this._loadCss();

		if( this.options.embededParent && o2.typeOf(this.options.embededParent)==="element" ){
			this.embeded = true;
		}
	},
	fireAppEvent: function (when) {
		this.fireEvent(when);
		if (this[("on-" + when).camelCase()]) this[("on-" + when).camelCase()]();
		//		if (this[("on-"+when).camelCase()+"Events"){
		//			this[("on-"+when).camelCase()+"Events".each(function(event){
		//				event.apply(this);
		//			}.bind(this));
		//		}
	},
	loadNoAnimation: function (isCurrent, max, hide) {
		this.fireAppEvent("queryLoad");
		if( this.embeded ){
			this.loadEmbeded();
		}else if (!this.inBrowser) {
			if (layout.viewMode==="Homepage"){
				this.loadWindowFlat(isCurrent);
			}else{
				this.loadWindow(isCurrent, false, max, hide);
			}
		} else {
			this.loadInBrowser(isCurrent);
		}
	},
	load: function (isCurrent, content) {
		this.fireAppEvent("queryLoad");
		if( this.embeded ){
			this.loadEmbeded();
		}else if (!this.inBrowser) {
			if (layout.viewMode==="Default" || this.viewMode==="Default"){
				this.loadWindowFlat(isCurrent);
			}else{
				this.loadWindow(isCurrent);
			}
		} else {
			this.loadInBrowser(content);
		}
	},
	loadApplication: function (callback) {
		if (callback) callback();
	},
	loadWindow: function (isCurrent, animation, max, hide) {
		this.fireAppEvent("queryLoadWindow");
		var options = {
			"style": "desktop_" + this.desktop.options.style,
			"title": this.options.title,
			"isResize": this.options.isResize,
			"isMax": this.options.isMax,
			"isRefresh": this.options.isWindowRefresh,
			"container": this.desktop.node,
			"onPostShow": function () {
				if (isCurrent) this.setCurrent();
				this.fireAppEvent("postLoadWindow");
				this.fireAppEvent("queryLoadApplication");
				//load css
				if (this.options.title) this.setTitle(this.options.title);
				if (this.stylePath) {
					(this.window.node || this.content).loadCss(this.stylePath, this.loadWindowApplication.bind(this));
				}else{
					this.loadWindowApplication();
				}
			}.bind(this),
			"onResize": function () {
				this.window.options.title = this.options.title;
				this.window.getTitle();
				this.fireAppEvent("resize");
			}.bind(this),
			"onResizeCompleted": function () {
				this.fireAppEvent("resizeCompleted");
			}.bind(this),
			"onMoveDrop": function (e) {
				if (Browser.name == "firefox") {
					if (e.event.clientX < 0 || e.event.clientY < 0) this.openInNewBrowser();
				} else {
					if (e.event.x < 0 || e.event.y < 0) this.openInNewBrowser();
				}

			}.bind(this)
		};

		if (this.options.event) {
			options.fromTop = this.options.event.page.y;
			options.fromLeft = this.options.event.page.x;
		}
		options.width = this.options.width || options.width;
		options.height = this.options.height || options.height;

		this.window = new MWF.xDesktop.Window(this, options);
		this.fireAppEvent("loadWindow");
		//this.maxSize();
		this.content = this.window.content;
		if (animation === false) {
			this.window.showNoAnimation(max, hide);
		} else {
			this.window.show();
		}
	},
	loadWindowApplication: function(){
		this.setContentEvent();
		this.content.addClass("appContent");
		this.loadApplication(function () {
			this.fireAppEvent("postLoadApplication");
		}.bind(this));
		this.fireAppEvent("postLoad");
	},

	loadWindowFlat: function (isCurrent) {
		this.window = {
			"app": this,
			"isHide": false,
			"isMax": true,
			"maxSize": function () { },
			"restore": function () { },
			"setCurrent": function () {
				//this.content.show();
				this.window.node.removeClass("layout_component_node_hide");
				this.window.node.addClass("layout_component_node_show");
				//this.window.node.fade("in");
			}.bind(this),
			"setUncurrent": function () {
				//this.content.hide();
				this.window.node.addClass("layout_component_node_hide");
				this.window.node.removeClass("layout_component_node_show");
				//this.window.node.fade("out");
			}.bind(this),
			"hide": function () { },
			"maxOrRestoreSize": function () { },
			"restoreSize": function () { },
			"close": function (callback) {
				this.content.destroy();
				if (callback) callback();
			}.bind(this)
		};

        // var component = this;
        // var OaComponent = class  extends HTMLDivElement {
        //     constructor() {
        //         super();
        //         var shadow = this.attachShadow({mode: 'open'});
        //
        //         // var shadow = layout.desktop.contentNode.attachShadow({mode: 'open'});
        //         // component.window.node = shadow;
        //         component.window.content = new Element("div.layout_component_content");
        //         component.content = component.window.content;
        //         shadow.appendChild(component.content);
        //     }
        // };
        // debugger;
        // var id = this.options.name.toLowerCase();
        // //var id = o2.uuid().substring(0,5).toLowerCase();
        // customElements.define('oa-component-'+id, OaComponent);
        // var node = document.createElement("oa-component"+id);
        // node.className="layout_component_node";
        // this.window.node = node;
        // layout.desktop.contentNode.appendChild(node);
        // component.content = new Element("div.layout_component_content").inject(node);

        // this.window.node = new Element("oa-component.layout_component_node").inject(layout.desktop.contentNode);


        // var shadow = layout.desktop.contentNode.attachShadow({mode: 'open'});
        // this.window.node = shadow;
        // this.window.content = new Element("div.layout_component_content");
        // this.content = this.window.content;
        // shadow.appendChild(this.content);

        this.window.node = this.windowNode || new Element("div.layout_component_node").inject(layout.desktop.contentNode);
		this.window.node.addClass('content-box');
		this.window.content = new Element("div.layout_component_content").inject(this.window.node);
		this.content = this.window.content;

		//this.window.setUncurrent();

		this.resizeFun = function(){
			this.fireAppEvent?.("resize");
		}.bind(this);

		layout.desktop.addEvent("resize", this.resizeFun);

		// window.addEventListener("beforeunload", function (e) {
		// 	this.fireAppEvent("queryClose");
		// }.bind(this));
		// window.addEventListener("pagehide", function (e) {
		// 	this.fireAppEvent("queryClose");
		// }.bind(this));

		if (isCurrent){
			this.setCurrent();
		}else{
			this.setUncurrent();
		}
		this.fireAppEvent("postLoadWindow");
		this.fireAppEvent("queryLoadApplication");

		//load css
		if (this.options.title) this.setTitle(this.options.title);
		if (this.stylePath) {
			(this.window.node || this.content).loadCss(this.stylePath, this.loadWindowApplication.bind(this));
		}else{
			this.loadWindowApplication();
		}
	},

	loadInBrowser: function (content) {
		this.window = {
			"isHide": false,
			"isMax": true,
			"maxSize": function () { },
			"restore": function () { },
			"setCurrent": function () {},
			"setUncurrent": function () {},
			"hide": function () { },
			"maxOrRestoreSize": function () { },
			"restoreSize": function () { },
			"close": function () { }
		};
		this.window.titleText = $(document.head).getElement("title");
		try {
			this.window.titleText.set("text", this.options.title);
		} catch (e) { }

		if (content && o2.typeOf(content)==="element") this.window.content = content;
		if (!this.window.content) this.window.content = $("appContent") || $("layout");
		if (!this.window.content) {
			this.window.content = new Element("div", {"styles": {"width": 0, "height": 0}}).inject(document.body);
		}
		this.content = this.window.content;
		//this.content.setStyles({"height": "100%", "overflow": "hidden"});

		window.addEvent("resize", function () {
			debugger;
			this.fireAppEvent("resize");
		}.bind(this));
		// $(document.body).addEvent("resize", function(){
		// 	debugger;
		//     this.fireAppEvent("resize");
		// }.bind(this));
		window.addEventListener("beforeunload", function (e) {
			this.fireAppEvent("queryClose");
		}.bind(this));

		if(layout.mobile){
			window.addEventListener("pagehide", function (e) {
				this.fireAppEvent("queryClose");
			}.bind(this));
		}

		// window.onbeforeunload = function(e){
		//     this.fireAppEvent("queryClose");
		// }.bind(this);

		this.fireAppEvent("postLoadWindow");
		this.fireAppEvent("queryLoadApplication");
		this.setContentEvent();

		if (this.options.title) this.setTitle(this.options.title);
		if (this.stylePath) o2.loadCss(this.stylePath);
		this.content.addClass("appContent");
		this.loadApplication(function () {
			this.fireAppEvent("postLoadApplication");
		}.bind(this));

		//this.content.setStyle("height", document.body.getSize().y);

		this.fireAppEvent("postLoad");
	},

	setEventTarget: function( eventTarget ){
		if( !this.embeded )return;

		if (this.eventTarget){
			if( this.resizeFun )this.eventTarget.removeEvent("resize", this.resizeFun );
			this.resizeFun = null;

			if( this.queryLoadFun )this.eventTarget.removeEvent("resize", this.queryLoadFun );
			this.queryLoadFun = null;

			if( this.postLoadFun )this.eventTarget.removeEvent("resize", this.postLoadFun );
			this.postLoadFun = null;
		}

		if(eventTarget) this.eventTarget = eventTarget;

		if (this.eventTarget){
			this.resizeFun = function () {
				debugger;
				this.fireAppEvent("resize");
			}.bind(this);
			this.eventTarget.addEvent("resize", this.resizeFun);

			this.queryLoadFun = function () {
				this.fireAppEvent && this.fireAppEvent("queryClose");
			}.bind(this);
			this.eventTarget.addEvent("queryClose", this.queryLoadFun);

			this.postLoadFun = function () {
				if (this.resizeFun) this.eventTarget.removeEvent("resize", this.resizeFun);
				this.fireAppEvent && this.fireAppEvent("postClose");
			}.bind(this);
			this.eventTarget.addEvent("postClose", this.postLoadFun);
		}
	},
	loadEmbeded: function(){
		if( !this.options.embededParent )return;

		this.window = {
			"isHide": false,
			"isMax": true,
			"maxSize": function(){},
			"restore": function(){},
			"setCurrent": function(){},
			"setUncurrent": function () {},
			"hide": function(){},
			"maxOrRestoreSize": function(){},
			"restoreSize": function(){},
			"close": function(){},
			"titleText" : {
				set : function(){}
			}
		};
		this.window.content = this.options.embededParent;
		this.content = this.window.content;

		// if( this.eventTarget && o2.typeOf( this.eventTarget.addEvent ) === "function" ){
		// 	this.setEventTarget();
		// }

		this.fireAppEvent("postLoadWindow");
		this.fireAppEvent("queryLoadApplication");
		this.setContentEvent();

		//if (this.options.title) this.setTitle(this.options.title);
		if (this.stylePath){
			(this.window.node || this.content).loadCss(this.stylePath, function () {
				this.loadApplication(function(){
					this.fireAppEvent("postLoadApplication");
				}.bind(this));
				this.fireAppEvent("postLoad");
			}.bind(this));
		}else{
			this.loadApplication(function(){
				this.fireAppEvent("postLoadApplication");
			}.bind(this));
			this.fireAppEvent("postLoad");
		}
	},

	openInNewBrowser: function (noClose) {
		this.desktop.openBrowserApp = this.options.name;
		this.desktop.openBrowserStatus = (this.recordStatus) ? this.recordStatus() : null;
		var status = (this.desktop.openBrowserStatus) ? JSON.encode(this.desktop.openBrowserStatus) : "";

		var url = "../x_desktop/app.html?app=" + this.options.name + "&status=" + status;
		window.open(o2.filterUrl(url), "_blank");
		if (!this.inBrowser) if (!noClose) this.close();
	},
	openInNewWindow: function () {
		this.desktop.openBrowserApp = this.options.name;
		this.desktop.openBrowserStatus = (this.recordStatus) ? this.recordStatus() : null;
		window.open(o2.filterUrl("../x_desktop/app.html"), "_blank");
		if (!this.inBrowser) this.close();
	},
	setContentEvent: function () {
		//		this.content.addEvents({
		//			"resize": function(){
		//				if (this.onResize) this.onResize();
		//			}.bind(this)
		//		});
	},
	setCurrent: function () {
        if (this.desktop.currentApp == this) return true;
        if (this.desktop.currentApp) {
            this.desktop.currentApp.setUncurrent();
        }

        this.window.setCurrent();

        if (this.taskitem) this.taskitem.selected();
        this.desktop.currentApp = this;

        this.desktop.appCurrentList.erase(this);
        this.desktop.appCurrentList.push(this);

        if (this.window.isHide) {
            if (this.window.isMax) {
                this.window.maxSize(function () { this.fireAppEvent("current"); }.bind(this));
            } else {
                this.window.restore(function () { this.fireAppEvent("current"); }.bind(this));
            }
        } else {
            this.fireAppEvent("current");
        }
		this.fireAppEvent('resize');
	},
	setUncurrent: function () {
		if (this.desktop.currentApp == this) {
			this.window.setUncurrent();
			if (this.taskitem) this.taskitem.unSelected();
			this.desktop.currentApp = null;
			this.fireAppEvent("uncurrent");
		}else{
			this.window.setUncurrent();
			if (this.taskitem) this.taskitem.unSelected();
		}
	},
	minSize: function () {
		this.fireAppEvent("queryMinSize");
		var p = this.taskitem.node.getPosition();
		this.setUncurrent();
		this.window.hide(p.x, p.y, function () {
			this.fireAppEvent("postMinSize");
		}.bind(this));
	},
	_minSize: function () {

		var p = this.taskitem.node.getPosition();
		this.setUncurrent();
		this.window.hide(p.x, p.y);
	},
	maxOrRestoreSize: function () {
		var max = true;
		if (this.window.isMax) max = false;
		this.fireAppEvent((max) ? "queryMaxSize" : "queryRestoreSize");

		this.window.maxOrRestoreSize(function () {
			this.fireAppEvent((max) ? "postMaxSize" : "postRestoreSize");
		}.bind(this));
	},
	maxSize: function (callback) {
		if (!this.window.isMax) {
			this.fireAppEvent("queryMaxSize");
			this.window.maxSize(function () {
				this.fireAppEvent("postMaxSize");
				if (callback) callback();
			}.bind(this));
		} else {
			if (callback) callback();
		}
	},
	_maxSize: function (callback) {
		this.window.maxSize();
	},
	restoreSize: function (callback) {
		this.fireAppEvent("queryRestoreSize");
		this.window.restoreSize(function () {
			this.fireAppEvent("postRestoreSize");
			if (callback) callback();
		}.bind(this));
	},
	_restoreSize: function (callback) {
		this.window.restoreSize();
	},
	refresh: function () {
		this.desktop.refreshApp(this);
	},
	close: function (hasTaskitem) {
		if (this.inBrowser) {
			window.open("", "_self").close();
			window.close();
		} else if( this.embeded ){

			this.window = null;
			this.fireAppEvent("queryClose");
			if (this.resizeFun && this.eventTarget) this.eventTarget.removeEvent("resize", this.resizeFun);
			this.fireAppEvent("postClose");
			o2.release(this);

		} else {
			this.fireAppEvent("queryClose");

			this.setUncurrent();
			this.window.close(function () {
				if (!hasTaskitem) this.taskitem.destroy();
				this.window = null;
				this.taskitem = null;
				if (this.resizeFun) layout.desktop.removeEvent("resize", this.resizeFun);
				this.desktop.closeApp(this, hasTaskitem);
				this.fireAppEvent("postClose");
				this.desktop.currentApp?.fireAppEvent('resize');
				o2.release(this);
			}.bind(this));
		}
	},
	setTitle: function (str) {
		try {
			if (this.taskitem) {
				this.taskitem.textNode.set("text", str);
				this.taskitem.node.set("title", str + ((this.appId) ? "-" + this.appId : ""));
				this.taskitem.setTaskitemSize();
			}
			this.options.title = str;
			this.window.titleText.set("text", str);
		} catch (e) { }

	},
	loading: function(){
		// if (this.taskitem){
		// 	if (this.taskitem.refreshNode) this.taskitem.refreshNode.addClass("icon_taskLoading");
		// }
		// this.loadingNode = new Element("div", {
		// 	"styles": {
		// 		"height": "100%",
		// 		"width": "100%",
		// 		"overflow": "auto",
		// 		"position": "absolute",
		// 		"top": "0px",
		// 		"left": "0px",
		// 		"background-repeat": "no-repeat",
		// 		"background-position": "center"
		// 	}
		// }).inject(this.content);
		// this.loadingNode.addClass("icon_loading");
	},
	unLoading: function(){
		// if (this.taskitem){
		// 	if (this.taskitem.refreshNode) this.taskitem.refreshNode.removeClass("icon_taskLoading");
		// }
		// if (this.loadingNode) this.loadingNode.destroy();
	},


	//application事件
	onQueryLoad: function () { },
	onQueryLoadWindow: function () { },
	onLoadWindow: function () { },
	onPostLoadWindow: function () { },
	onQueryLoadApplication: function () { },
	onPostLoadApplication: function () { },
	onPostLoad: function () { },
	onResize: function () { },
	onQueryClose: function () { },
	onPostClose: function () { },
	onQueryMinSize: function () { },
	onPostMinSize: function () { },
	onQueryMaxSize: function () { },
	onPostMaxSize: function () { },
	onQueryRestoreSize: function () { },
	onPostRestoreSize: function () { },

	dialog: function (options) {
		MWF.require("MWF.xDesktop.Dialog", function () {
			options.markNode = this.content;
			var dlg = new MWF.xDesktop.Dialog(options);
			dlg.show();
		}.bind(this));
	},
	notice: function (content, type, target, where, offset) {
		if (window.mBox){
			if (!where) where = { "x": "right", "y": "top" };
			if (!target) target = this.content;
			if (!target) target = this.window.content;
			if (!type) type = "ok";
			var noticeTarget = target || layout.layout.contentNode;
			// 移动端如果向下滚动了就看不到了
			if (layout.mobile) {
				noticeTarget = $(document.body);
			}

			var off = offset;
			if (!off) {
				off = {
					x: 10,
					y: where.y.toString().toLowerCase() == "bottom" ? 10 : 10
				};
			}
			new mBox.Notice({
				type: type,
				position: where,
				move: false,
				target: noticeTarget,
				delayClose: (type == "error") ? 10000 : 5000,
				offset: off,
				content: content
			});
		}
	},
	confirm: function (type, e, title, text, width, height, ok, cancel, callback, mask, style) {
		MWF.require("MWF.xDesktop.Dialog", function () {
			var content = layout.mobile ? $(document.body) : this.content || $(document.body);
			var size = content.getSize();
			var x = 0;
			var y = 0;

			if (layout.mobile) {
				if (parseFloat(width) > size.x) {
					width = size.x - 40;
					x = 40;
				} else {
					x = (size.x - parseFloat(width)) / 2;
				}
				if (parseFloat(height) > size.y) {
					y = 0;
				} else {
					y = (size.y - parseFloat(height)) / 2;
				}
			} else {
				if (typeOf(e) == "element") {
					var position = e.getPosition(content);
					x = position.x;
					y = position.y;
				} else {
					if (Browser.name == "firefox") {
						x = parseFloat(e.event ? (e.event.clientX || e.event.x) : e.clientX);
						y = parseFloat(e.event ? (e.event.clientY || e.event.y) : e.clientY);
					} else {
						x = parseFloat(e.x || e.event.x);
						y = parseFloat(e.y || e.event.y);
					}

					if (e.target) {
						var position = e.target.getPosition(content);
						x = position.x;
						y = position.y;
					}
				}
				if (x + parseFloat(width) > size.x) {
					x = x - parseFloat(width);
				}
				if (x < 0) x = 0;
				if (y + parseFloat(height) > size.y) {
					y = y - parseFloat(height);
				}
				if (y < 0) y = 0;
				// 鼠标位置往左偏移
				x = x - 20;
			}


			var ctext = "";
			var chtml = "";
			if (typeOf(text).toLowerCase() == "object") {
				ctext = text.text;
				chtml = text.html;
			} else {
				ctext = text;
			}

			// var tmp = new Element("div", {"overflow": "hidden","padding": "10px", "padding-left": "60px", "width": ""+width+"px"}).inject(document.body);
			// if (chtml) tmp.set("html", chtml);
			// if (ctext) tmp.set("text", ctext);
			// height = tmp.getSize().y;
			// tmp.destroy();

			var dlg = new MWF.xDesktop.Dialog({
				"title": title,
				"style": style || "o2",
				"top": y,
				"left": x,
				"fromTop": y,
				"fromLeft": x,
				"width": width,
				"height": height,
				"text": ctext,
				"html": chtml,
				"container": content,
				"mark": (mask) ? true : false,
				"maskNode": mask || content,
				"buttonList": [
					{
						"type": "ok",
						"text": MWF.LP.process.button.ok,
						"action": ok
					},
					{
						"type": "cancel",
						"text": MWF.LP.process.button.cancel,
						"action": cancel
					}
				]
			});

			switch (type.toLowerCase()) {
				case "success":
					dlg.content.setStyle("background-image", "url(data:image/png;base64,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)");
					break;
				case "error":
					dlg.content.setStyle("background-image", "url(data:image/png;base64,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)");
					break;
				case "info":
					dlg.content.setStyle("background-image", "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAjCAYAAAAe2bNZAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAABvBJREFUeNqsWF1sFFUUPndm9n+3W5aWLi2VGgJtgy3UEn6MQGI0GgmC0UgfTEjEBxPDA29qYqLGGOODifGBGGOUYOKDPIg2QgykWgUtP1WgLT+lFKFCf9l2uz+z83c9Z3p3u1u6u4Pxpqczd+7MPd8999xzvrPskb2fgsMW4NzaBpxvBsbWMWCrgUEdAKsA4HHO+R2wrOucmxe5qZ9Jjt3ovtX1eRznt0pN2ndof+5eKYcAJ34YJPlFvH3OFV7+uOyPgOQLg+wJAXP5gMkueifM9XTYzMw2W+mZnWbqHjDF09Pc8WFneur2kaHOjwbxewuB8VK6WCnLoCVexcsrnmWNW1zhKMiBKqdWBDM5CfrMKKh3+8+bWurw1W/f/gwfawstVdYyuNIGtMYBxqT9/lVbmRyIZMFlUeKfCdyiPi0WN02ScPdkvGX2KxJa0IOiVETbU0O/Ptr00getamzkY1R+lbAuZiV52fpnC4FY5lqQpPe80bX7/A2bmIRbQcpzggAQLFhaGiw1aV+5nqEPEQcjWDnAJJLLC57q1Ux2+9tATzwUXN40PH3j7Nj4hWMW6cbr4mDmLIJAals63Esbsk8LhFsGAkjBY3UaPN8M8HKbBGsiHBRmwK1pEy0kC+Pkf4eK/EtA8gTX8Mxs1Lukti9+6+IUAco3ROE24dZ4apo6XEvq57dkQbPQKtsQ575NleB1z30erQbYsMoApScJ3bd1kMRWLWw0r9/Ud+Ci72H3AMoMinGfZchZ0Ufe961Yz/LNvFBoi/ZuDMKaukoIBAIQDofB7XaD1+MGl8Thl6EMWkYq+r3srQAzfrc1VN8yG7t26k/UpGfNJ+WOL54ab30746TQMkuIBVuaaiAUCoHf7wdFUewr9ek5jZf8HucnPe7Q0j3R9t0tqNdtn4AsGIoj7sjKLbI3ZDtiKSEnvTyqgSzLhScB+/ScxsvNQXq8NY0twdrGF/DTYBYH/QtQQJN9lbZzlhOa7MRADHRDnB4h1KfnNO5kHtLnCkSeCERXR4V1QK5e98yTij/ypquyrug+Fwhu7+BoGsbjGngVCaoq3NA7PAuHT4/BjxdjUMrf8oUpqN/IRNGO/TM3e69QQFQo1zB3wN7PMokht+802Q/nUij/5MVyNnesJTnrAmUb6UXfacPb71ESCiU9CkxQBsxcfFHB0tXFjz2CkRQP5iw/AlIcgSG9sjfYiLc+CjMKZV8mk4GM0mBw/MDTUdjc4ANVVUHXdftk5AIWnqozf6tw8FQc44yz/EV6ZZe3XvgM9ogGUFwoYxmav7IyAitXLgNN0yCRSNiAcgHN5YJdyyU42N2LSzYdopHId6rmwdh8BBz4DMA7Ry7D71fG4d2OFjvQFVqOg2EY837lsGGADIhMIFGojIOpoWUMB2LCsd4RSGdKbKmjeYSgXgSeEoZnCjE0y8iEMa06Wgk3DQxOJiZvdFhJWsTRnVuGIxjL0CazGVWxqaKeaba5iLMZcoGu2Dg4BYPUA0/niEiWlkKc1TLUnXYQcjKBZZQd55azhaFeMNLx6xTwiHApRJ65oTleTdn3rAewDOpVY3cGcmCIxQfrPD3I6DYRuS5vGbPsuBOfISqiJyb7Jge6zmE3TVslUTmBCDs5miy3qqJCJ6CMItPMnbxSQvoyM2OnM9N3iWglbcsQW6dyAq2yW5Hk9rncUiQ3oSKT9hnjCTkwRd15DKb93DRwkQwToVw8R5Hl0CoDscE/TmI3jqLSBttnk+oaKiesTJIT4V5MuGHY5Ht7cxWk00jGrcL8RH16TuM2STcMKDYX6UlN3Dw+PdQzKMBoOdpJDH1qoOuvSOPWWklxt9krWkg3cTVv7NkAr+3aaFNNsko+n6G+z+eDra0PQU2lD37rv7MonSBfUaduHx0+/skXODqGEsvyYNsyoobRqK4xUrFOCkZ2vMgThqYPBUMQDAbtYJcPJCv0nMbpPXp/4Rw0L/pI12T/yW9Q36QAomU5cEFFiQWW0vDU6xu9kRVvuXwVO+wE+n81pB2Z+HjX1JXuQ1NzJ2i0aHVADbeLU4FFdY3s9vkll6eVAWcLa6cHFeQ/XL03cnTi0k9fYUVwgVQJXzGKVpTCfywqsBB9F5UTyDmq8aTVsP8Cgk5ZJjGQHL32NfkIBrjhPCA6uUfRijIfEO0l1TWKJ3gWnXoG61w/U1zRnFPC/VVjlvFRM9REH4aM7yYunfhy7PzRn4WzThC9pOFsrZ0PpuSvEOhDkiA+QWLxS5u2byPOSlSRGBoRI+IjRAMo+1LSo1xDIZ4iqwhocSGJcr9COCGITJw6AuUVpY1P9N2CGDFhHkOcDk2E+KQIaNS3Ck24uKIHaQRKFgBkIVIeGFJoCjHE1XI6+b8CDABnZtjY0mkIGQAAAABJRU5ErkJggg==)");
					break;
				case "warn":
					dlg.content.setStyle("background-image", "url(data:image/png;base64,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)");
					break;
				default:
				//dlg.content.setStyle("background-image", "");
			}
			dlg.show();
			if (callback) callback(dlg);
		}.bind(this));
	},
	dlg: function (type, e, title, text, width, height, actions, mask, style) {
		MWF.require("MWF.xDesktop.Dialog", function () {
			var size = this.content.getSize();
			var p = (e) ? MWF.getEPointer(e) : MWF.getCenter({ "x": width, "y": height }, this.content, this.content);
			var x = p.x || 0;
			var y = p.y || 0;

			if (x + parseFloat(width) > size.x) {
				x = x - parseFloat(width);
			}
			if (x < 0) x = 0;
			if (y + parseFloat(height) > size.y) {
				y = y - parseFloat(height);
			}
			if (y < 0) y = 0;

			var ctext = "";
			var chtml = "";
			if (typeOf(text).toLowerCase() === "object") {
				ctext = text.text;
				chtml = text.html;
			} else {
				ctext = text;
			}

			var dlg = new MWF.xDesktop.Dialog({
				"title": title,
				"style": style || "o2",
				"top": y,
				"left": x - 20,
				"fromTop": y,
				"fromLeft": x - 20,
				"width": width,
				"height": height,
				"text": ctext,
				"html": chtml,
				"container": this.content,
				"mark": (mask) ? true : false,
				"maskNode": mask || this.content,
				"buttonList": actions
			});

			switch (type.toLowerCase()) {
				case "success":
					dlg.content.setStyle("background-image", "url(data:image/png;base64,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)");
					break;
				case "error":
					dlg.content.setStyle("background-image", "url(data:image/png;base64,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)");
					break;
				case "info":
					dlg.content.setStyle("background-image", "url(data:image/png;base64,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)");
					break;
				case "warn":
					dlg.content.setStyle("background-image", "url(data:image/png;base64,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)");
					break;
				default:
			}
			dlg.show();
		}.bind(this));
	},
	alert: function (type, e, title, text, width, height, callback) {
		MWF.require("MWF.widget.Dialog", function () {
			var size = $(document.body).getSize();
			var x = 0, y = 0;
			if (e === "center") {
				if( layout.mobile ){
					x = (size.x - parseFloat(width)) / 2;
					y = (size.y - parseFloat(height)) / 2;
				}else{
                    var p = o2.getCenterPosition(this.content, width, height);
                    x = p.x;
                    y = p.y;
				}
			} else {
				x = parseFloat(e.event.x);
				y = parseFloat(e.event.y);
				if (Browser.name == "firefox") {
					x = parseFloat(e.event.clientX);
					y = parseFloat(e.event.clientY);
				}
				x = x - parseFloat(width) / 2;
				y = y - parseFloat(height) / 2;
			}

			if (x + parseFloat(width) > size.x) {
				x = x - parseFloat(width);
			}
			if (x < 0) x = 0;

			if (y + parseFloat(height) > size.y) {
				y = y - parseFloat(height);
			}
			if (y < 0) y = 0;


			var ctext = "";
			var chtml = "";
			if (typeOf(text).toLowerCase() == "object") {
				ctext = text.text;
				chtml = text.html;
			} else {
				ctext = text;
			}

			var dlg = new MWF.DL({
				"title": title,
				"style": "o2",
				"top": y,
				"left": x,
				"fromTop": y,
				"fromLeft": x,
				"width": width,
				"height": height,
				"text": ctext,
				"html": chtml,
				"maskNode": layout.mobile ? $(document.body) : this.content,
				"container": layout.mobile ? $(document.body) : this.content,
				"buttonList": [
					{
						"text": MWF.LP.process.button.ok,
						"action": function () {
							if( typeOf(callback) === "function" )callback();
							this.close();
						}
					}
				]
			});

			switch (type.toLowerCase()) {
				case "success":
					dlg.content.setStyle("background-image", "url(data:image/png;base64,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)");
					break;
				case "error":
					dlg.content.setStyle("background-image", "url(data:image/png;base64,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)");
					break;
				case "info":
					dlg.content.setStyle("background-image", "url(data:image/png;base64,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)");
					break;
				case "warn":
					dlg.content.setStyle("background-image", "url(data:image/png;base64,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)");
					break;
				default:
			}
			dlg.content.setStyle("overflow","auto");
			dlg.show();
		}.bind(this));
	}
});
