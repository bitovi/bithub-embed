import fixtures from "../fixtures/fixture_data.json";
import can from "can";
import $ from "jquery";

import Bit from "../models/bit";

import "../bits_carousel/";
import "../bit_carousel/";

import "../style/embed.less!";

//var bitData = new Bit.List(fixtures.data.slice(0, 10));

var RealBit = can.Model.extend({
	findAll: function(params){
		return $.ajax({
			url: 'http://bithub.loc/api/v3/embeds/4/entities?view=public&tenant_name=scenic_winter_2942&' + $.param(params)
		});
	},
}, {});


var template = can.stache('<bh-bits-carousel bit-tag="bh-bit-carousel" bit-model="{bitModel}"></bh-bits-carousel>');

var State = can.Map.extend({
	isAdmin(){
		return false;
	},
	assetRoot: "../",
	hubId: 1
});

$('#app').html(template({
	bitModel: RealBit,
	state: new State()
}));
