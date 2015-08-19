import fixtures from "../fixtures/fixture_data.json";
import can from "can";
import $ from "jquery";

import Bit from "../models/bit";

import "./bits_vertical_infinite_grouped";
import "../bit/";

import "../style/embed.less!";

var firstData = fixtures.data.splice(0, 25);
var bitData = new Bit.List(firstData);

setTimeout(function(){
	bitData.push.apply(bitData, fixtures.data);
}, 10000);


var template = can.stache('<bh-bits-vertical-infinite-grouped bits={bits} state={state}></bh-bits-vertical-infinite-grouped>');

var State = can.Map.extend({
	isAdmin(){
		return false;
	},
	assetRoot: "../",
	hubId: 1
});

$('#app').html(template({
	bits: bitData,
	state: new State()
}));
