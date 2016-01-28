import can from "can";
import initView from "./body-wrap.stache!";
import "./body-wrap.less!";
import "can/construct/proxy/";

var calculateRatioPercentage = function(width, height){
	return (height/width) * 100;
};

var getIframeRatioClass = function(width, height){
	var ratioPercentage = calculateRatioPercentage(width, height);
	if(ratioPercentage - 56 < 5){
		return 'iframe-16-9';
	}
	return 'iframe-4-3';
};

can.Component.extend({
	tag: 'bh-body-wrap',
	template : initView,
	scope : {
		toggleExpanded : function(){
			this.attr('isExpanded', !this.attr('isExpanded'));
		}
	},
	events : {
		inserted : function(){
			this.wrapImages();
			this.wrapIframes();
			setTimeout(this.proxy('recalculateHeight'), 1);
		},
		wrapImages : function(){
			var imgs = this.element.find('img');
			imgs.each(function(){
				var $img = $(this);
				if(!$img.parent().is('.img-wrap')){
					$img.wrap('<div class="img-wrap"></div>');
				}
			});
			imgs.on('load', this.proxy('recalculateHeight'));
		},
		wrapIframes : function(){
			var iframes = this.element.find('iframe');
			iframes.each(function(){
				var $iframe = $(this);
				var height = $iframe.attr('height');
				var width = $iframe.attr('width');
				var iframeRatioClass = getIframeRatioClass(width, height);
				if(!$iframe.parent().is('.iframe-wrap')){
					$iframe.wrap('<div class="iframe-wrap ' + iframeRatioClass + '"></div>');
				}
			});
		},
		recalculateHeight : function(){
			if(this.scope.attr('isExpanded') || !this.element){
				return;
			}

			var wrap = this.element.find('.body-wrap');
			var scrollHeight = wrap[0].scrollHeight;
			var height = wrap.height();

			this.scope.attr('isTooTall', height < scrollHeight);
		},
		'{scope} isExpanded' : function(){
			var self = this;
			setTimeout(function(){
				self.element.trigger('cardExpanded', [self.element.closest('bh-bit-carousel').outerHeight()]);
			}, 1);
		}
	}
});
