import can from "can/";
import initView from "./bit_carousel.stache!";
import _map from "lodash-amd/modern/collection/map";

import "./image-gallery/image-gallery";
import "./body-wrap/body-wrap";
import "./share-bit/share-bit";

import "./bit_carousel.less!";
import "can/construct/super/super";

// Image loading statuses
var IMAGE_STATUSES = {
	LOADING : 'LOADING',
	LOADED  : 'LOADED',
	ERROR   : 'ERROR'
};

// check image's status. It's either still loading, loaded or errored
var imageStatus = function(img){
	if(!img.complete){
		return IMAGE_STATUSES.LOADING;
	}
	if(img.naturalWidth === 0){
		return IMAGE_STATUSES.ERROR;
	}
	return IMAGE_STATUSES.LOADED;
};

export var BitVM = can.Map.extend({
	actionFail: null,
	sharePanelOpen: false,
	toggleApproveBit : function(){
		if(this.attr('bit.is_approved')){
			this.disapproveBit();
		} else {
			this.approveBit();
		}
	},
	togglePinBit : function(){
		if(this.attr('bit.is_pinned')){
			this.unpinBit();
		} else {
			this.pinBit();
		}
	},
	actionFailTitle : function(){
		var actionFail = this.attr('actionFail');
		return actionFail === 'disapprove' ? 'block' : actionFail;
	},
	removeFailNotice : function(){
		this.attr('actionFail', null);
	},
	showAdminPanel : function(){
		return !!this.attr('state').isAdmin() && !(this.attr('actionFail'));
	},
	sharePanelToggle : function(){
		this.attr('sharePanelOpen', !this.attr('sharePanelOpen'));
	},
	shouldRender : function(){
		var bit = this.attr('bit');
		return bit && !bit.attr('__pendingRender');
	},
	blockedClass : function(){
		if(!!this.attr('state').isAdmin() && !this.attr('bit').attr('is_approved')){
			return 'blocked';
		}
		return "";
	},
	pinnedClass : function(){
		if(!!this.attr('state').isAdmin() && this.attr('bit').attr('is_pinned')){
			return 'pinned';
		}
		return "";
	}
});

var BIT_ACTIONS = ['pin', 'unpin', 'approve', 'disapprove'];

for(var i = 0; i < BIT_ACTIONS.length; i++){
	BitVM.prototype[BIT_ACTIONS[i] + 'Bit'] = (function(action){
		return function(){
			var self = this;
			var def = this.attr('bit')[action](this.attr('state.hubId'));
			def.fail(function(){
				self.attr('actionFail', action);
			});
		};
	})(BIT_ACTIONS[i]);
}

can.Component.extend({
	tag: 'bh-bit-carousel',
	template : initView,
	scope : BitVM,
	helpers : {
		formattedTitle : function(title){
			title = can.isFunction(title) ? title() : title;
			if(title && title !== 'undefined'){
				return title;
			}
			return "";
		}
	},
	events : {
		inserted : function(){
			var bit = this.scope.attr('bit');

			if(!bit.attr('__pendingRender')){
				this.__initTimeout = setTimeout(this.proxy('initImages'));
			}

			// We need to wait until the bit was loaded to calculate it's height
			// When the bit is loaded the `animate-height` class is removed from the bit
			// which will cause the height transition. After the transition is done
			// we remove the explicit height so bit can be resized based on user's actions.
			// If bit was already on the page we don't have to wait for all images to load
			// before removing the height.
			if(!bit.attr('__resolvedHeight')){
				this.element.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', this.proxy('removeExplicitHeight'));
				
			} else {
				this.removeExplicitHeight();
			}
		},
		'{bit} __pendingRender' : function(bit, ev, newVal){
			if(newVal === false){
				setTimeout(() => {
					if(this.element){
						this.__initTimeout = setTimeout(this.proxy('initImages'));
						this.bitLoadedAndRendered();
					}
				}, 1);
			}
		},
		initImages : function(){
			this.imgs = this.element.find('img').toArray();
			this.imagesToLoadCount = this.imgs.length;

			if(this.imgs.length){
				this.__imgSweeperTimeout = setTimeout(this.proxy('imgSweeper'), 500);
			} else {
				this.doneLoading();
			}
		},
		'a click' : function(el, ev){
			ev.preventDefault();
			window.open(el.attr('href'));
			this.element.trigger('interaction:link', [this.scope.attr('state.hubId'), this.scope.attr('bit.id')]);
		},
		// Go through all images and make sure all are loaded or errored
		// Before calling the `doneLoading` function which will remove the loading class
		imgSweeper : function(){
			var statuses = _map(this.imgs, imageStatus);
			var errored;

			// If any of the images is still loading, check again in 500ms
			if(can.inArray(IMAGE_STATUSES.LOADING, statuses) > -1){
				this.__imgSweeperTimeout = setTimeout(this.proxy('imgSweeper'), 500);
			} else {
				this.doneLoading();
			}

			for(var i = 0; i < statuses.length; i++){
				if(statuses[i] === IMAGE_STATUSES.ERROR){
					errored = this.imgs.splice(i, 1)[0];
					if(errored){
						$(errored).remove();
					}
				}
			}
		},
		// All images in bit are loaded and we can calculate it's height. We set the explicit height
		// to make sure that that the transition animation runs.
		doneLoading : function(){
			var bit = this.scope.attr('bit');
			if(!bit.attr('__resolvedHeight')){
				this.element.find('.bit-wrap').height(this.element.find('.bit').height());
			}
			bit.attr('__isLoaded', true);
			this.bitLoadedAndRendered();
		},
		// When we're done with the height transition remove the explicit height
		// and mark the bit's height as resolved
		removeExplicitHeight : function(){
			var self = this;
			this.__removeExplicitHeightTimeout = setTimeout(function(){
				self.scope.attr('bit').attr('__resolvedHeight', true);
				if(self.element){
					self.element.find('.bit-wrap').css('height', 'auto');
					self.bitLoadedAndRendered();
				}
			}, 1);
		},
		bitLoadedAndRendered : function(){
			var bit = this.scope.attr('bit');
			var check = bit.attr('__resolvedHeight') && bit.attr('__isLoaded') && !bit.attr('__pendingRender');

			if(check){
				this.element.trigger('bit:loaded');
			}
					
		},
		// Clean up the timeouts
		destroy : function(){
			clearTimeout(this.__imgSweeperTimeout);
			clearTimeout(this.__initTimeout);
			clearTimeout(this.__removeExplicitHeightTimeout);
			return this._super.apply(this, arguments);
		}
	}
});
