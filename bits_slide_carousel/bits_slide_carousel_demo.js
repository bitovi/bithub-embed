import can from "can";
import $ from "jquery";

import Bit from "models/bit";

import "bits_slide_carousel/";
import "bit_carousel/";

import "style/embed.less!";

//var bitData = new Bit.List(fixtures.data.slice(0, 10));

var RealBit = Bit.extend({
	findAll: function(params){
		return $.ajax({
			url: 'http://bithub.com/api/v4/embeds/1/entities?view=public&tenant_name=radioactive_fern_9050&image_only=true&' + $.param(params)
		});
	},
}, {});


var template = can.stache('<bh-bits-slide-carousel bit-tag="bh-bit-carousel" bit-model="{bitModel}"></bh-bits-slide-carousel>');

var State = can.Map.extend({
	isAdmin(){
		return false;
	},
	assetRoot: "../",
	hubId: 1
});

$('body').on('cardExpanded', function(ev, height){
	var parent = window.parent;
	if(parent){
		parent.postMessage('cardExpanded:' + height, '*');
	}
});

$('#app').html(template({
	bitModel: RealBit,
	state: new State()
}));
