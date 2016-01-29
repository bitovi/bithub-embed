import QUnit from "steal-qunit";
import "./body-wrap";
import can from "can";


QUnit.module("body-wrap");


test("basics", function(){
	var template = can.stache("<bh-body-wrap>"+(new Array(40).join("<p>text</p>"))+"</bh-body-wrap>");
	
	$("#qunit-fixture").append(template());
	
	QUnit.stop();
	setTimeout(function(){
		QUnit.equal( $("#qunit-fixture").find("bh-body-wrap .collapsed").length, 1, "wrap has collapsed styling");
		QUnit.start();
	},20);
	
});

