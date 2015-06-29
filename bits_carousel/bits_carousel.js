import can from "can";
import initView from "./bits_carousel.stache!";
import BitModel from "models/bit";

import "./bits_carousel.less!";
import "can/map/define/";



export default can.Component.extend({
	tag: 'bh-bits-carousel',
	template: initView,
	scope : {
		bitTag: 'bh-bit',
		hasNextPage: true,
		isLoading: false,
		fromLeft: 0,
		carouselWidth: 0,
		define : {
			params : {
				value : function(){
					return new can.Map();
				},
				get : function(lastSetValue){
					lastSetValue = lastSetValue || new can.Map();
					lastSetValue.attr('offset', lastSetValue.offset || this.attr('bits').length || 0);
					lastSetValue.attr('limit', 5);
					return lastSetValue;
				}
			},
		},
		getBitModel : function(){
			return this.bitModel || BitModel;
		},
		init : function(){
			var bitModel = this.getBitModel();
			this.attr('bits', new bitModel.List());
			this.loadNextPage();
		},
		loadNextPage : function(){
			var self = this;
			var params;

			if(this.attr('hasNextPage')){
				this.attr('isLoading', true);

				params = this.attr('params').attr();
				//return;
				this.getBitModel().findAll(params).then(function(data){
					can.batch.start();
					
					if(data.length < self.attr('params.limit')){
						self.attr('hasNextPage', false);
					}

					self.attr('params.offset', self.attr('params.offset') + data.length);
					self.attr('isLoading', false);
					self.attr('bits').push.apply(self.attr('bits'), data);
					
					can.batch.stop();
				}, function(){
					self.attr({
						isLoading: false,
						hasNextPage: false
					});
				});
			}
		},
		carouselContentWidth : function(){
			var width = this.attr('bits').attr('length') * 400;
			if(this.attr('isLoading')){
				width = width + 400;
			}
			return width;
		},
		carouselNext : function(){
			if(this.attr('isLoading')){
				return;
			}

			var next = this.attr('fromLeft') + 400;
			if(next > this.maxFromLeft()){
				this.loadNextPage();
				next = next + 400;
			}
			this.attr('fromLeft', Math.min(next, this.maxFromLeft()));
		},
		maxFromLeft : function(){
			return this.carouselContentWidth() - this.attr('carouselWidth') - 10;
		},
		carouselPrev : function(){
			this.attr('fromLeft', Math.max(0, this.attr('fromLeft') - 400));
		}
	},
	helpers : {
		renderCard : function(bit, opts){
			var tag = this.attr('bitTag');
			var template = can.stache('<' + tag + ' bit="{bit}" state="{state}"></' + tag + '>');
			return template(opts.scope.add({bit: bit}));
		}
	},
	events : {
		init: function(){
			this.measureWidth();
		},
		'{window} resize': 'measureWidth',
		measureWidth: function(){
			var self = this;
			clearTimeout(this.__measureWidthTimeout);
			this.__measureWidthTimeout = setTimeout(function(){
				self.scope.attr('carouselWidth', self.element.find('.outer-carousel-wrap').width());
			});
		}
	}

});
