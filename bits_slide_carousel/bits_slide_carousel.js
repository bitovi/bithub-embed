import can from "can";
import initView from "./bits_slide_carousel.stache!";
import BitModel from "models/bit";

import "owl.carousel/dist/owl.carousel.js";
import "./bits_slide_carousel.less!";
import "can/map/define/";
import "owl.carousel/dist/assets/owl.carousel.css!";
import "owl.carousel/dist/assets/owl.theme.default.css!";


export default can.Component.extend({
	tag: 'bh-bits-slide-carousel',
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
					lastSetValue.attr('limit', 10);
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
		},
		initCarousel : function(){
			return function(el){
				$(el).owlCarousel({
					items: 1
				});
			}
		},
		addToCarousel : function(){
			return function(el){
				setTimeout(function(){
					var $el = $(el);
					var carousel = $el.closest('.carousel-outer-wrap').find('.carousel-wrap').data()["owl.carousel"];
					carousel.add($el);
					carousel.refresh();
				}, 1);
			}
		}
	},
	events : {
		init: function(){
			this.measureWidth();
		},
		inserted : function(){
			//this.element.find('.carousel-wrap').owlCarousel();
		},
		'{scope.bits} add' : function(bits, ev, newData){
			var carousel = this.getCarousel();
			//this.element.find('.carousel-wrap').trigger('refresh.owl.carousel');
		},
		getCarousel : function(){
			return this.element.find('.carousel-wrap').data()["owl.carousel"];
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
