import {BitVM} from "./bit";
import fixtureData from "../fixtures/fixture_data.json";
import QUnit from "steal-qunit";
import F from "funcunit";
import Bit from "models/bit";
import $ from "jquery";

F.attach(QUnit);

var testBit = $.extend({}, fixtureData.data[0], {id: Date.now()});

var template = can.stache("<bh-bit bit='{bit}' state='{state}'></bh-bit>");
var getState = function(isAdmin){
	var stateMap = can.Map({}, {
		isAdmin: function(){
			return isAdmin;
		}
	});
	return new stateMap({hubId: 1});
};

var renderTemplate = function(data){
	$('#qunit-fixture').html(template(data));
};

QUnit.module("Bit Test");

QUnit.test("Dynamic functions exist on the prototype", 4, function(){
	var actions = ['pin', 'unpin', 'approve', 'disapprove'];

	for(var i = 0; i < actions.length; i++){
		if(typeof BitVM.prototype[actions[i] + 'Bit'] === 'function'){
			ok(true, actions[i] + 'Bit action is defined on the prototype');
		}
	}
});

QUnit.test("Card is correctly rendered", 4, function(){
	renderTemplate({
		bit: Bit.model(testBit),
		state: getState(false)
	});

	F('bh-bit .admin-panel').missing('Admin panel is not rendered');
	F('bh-bit bh-image-gallery').exists('Image gallery is rendered');
	F('bh-bit bh-body-wrap').exists('Body wrap is rendered');
	F('bh-bit bh-share-bit').exists('Share panel is rendered');
});

QUnit.test("Admin panel is rendered", function(){
	renderTemplate({
		bit: Bit.model(testBit),
		state: getState(true)
	});

	F('bh-bit .admin-panel').exists('Admin panel is rendered');
});

QUnit.test("Card goes through the lifecycle", 4, function(){
	renderTemplate({
		bit: Bit.model(testBit),
		state: getState(false)
	});
	F('bh-bit .loading').exists('Card is in the loading state');
	F('bh-bit .animate-height').exists('Card is awaiting animation');
	F('bh-bit .loading').missing('Card is loaded');
	F('bh-bit .animate-height').missing('Card has resolved height');
});

QUnit.test("Sharing panel is expanded on click", 3, function(){
	var bit =  Bit.model(testBit);
	renderTemplate({
		bit: bit,
		state: getState(false)
	});
	F('bh-bit .share-panel-toggle').exists('Share button is visible');
	F('bh-bit .share-panel-toggle').click();
	F('bh-share-bit.expanded').exists('Share panel is expanded');
	F.wait(1, function(){
		ok($('bh-bit').scope().attr('sharePanelOpen'), 'VM is updated with share panel attr');
	});
});
