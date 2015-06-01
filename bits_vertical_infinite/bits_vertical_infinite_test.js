import PartitionedColumnList from "./partitioned_column_list";

import QUnit from "steal-qunit";
import F from "funcunit";
import $ from "jquery";
import Bit from "../models/bit";
import fixtureData from "../fixtures/fixture_data.json";

import "./bits_vertical_infinite";
import "../bit/";

var template = can.stache('<bh-bits-vertical-infinite state="{state}" bits="{bits}"></bh-bits-vertical-infinite>');

var withRendered = function(data){
	$('#qunit-fixture').html('<div class="bh-bits bh-bits-test"></div>');
	$('.bh-bits-test').html(template(data));
	return function(){
		$('#qunit-fixture').html('');
	};
};

var State = can.Map.extend({
	hubId : 1,
	isAdmin: function(){
		return false;
	},
	assetRoot: "./"
});

QUnit.module('Bits Vertical Infinite Test');

QUnit.test('List Partitioning', function(){
	var sourceList = new can.List();
	var list = new PartitionedColumnList(sourceList);
	var firstColumn;

	list.resetColumns(3);

	QUnit.equal(sourceList, list.source(), 'PartitionedColumnList keeps pointer to the sourceList');
	
	sourceList.push(1,2,3,4,5,6,7,8,9);

	QUnit.deepEqual(list.columns().attr(), [[1,4,7], [2,5,8], [3,6,9]], 'Initial partitioning');
	
	list.resetColumns(5);

	QUnit.deepEqual(
		list.columns().attr(),
		[[1, 6], [2, 7], [3, 8], [4, 9], [5]],
		'Changing column count'
	);

	sourceList.push(10, 11);

	QUnit.deepEqual(
		list.columns().attr(),
		[[1, 6, 11], [2, 7], [3, 8], [4, 9], [5, 10]],
		'Appending Data'
	);

	list.resetColumns();

	QUnit.deepEqual(
		list.columns().attr(),
		[[1, 6, 11], [2, 7], [3, 8], [4, 9], [5, 10]],
		"Reseting columns with the same data and column count produces same results"
	);


	list.prependPaused(true);
	sourceList.unshift(1001, 1002, 1003);

	QUnit.deepEqual(
		list.columns().attr(),
		[[1, 6, 11], [2, 7], [3, 8], [4, 9], [5, 10]],
		"Prepending data will not change columns immediately"
	);

	list.resetColumns();

	QUnit.deepEqual(
		list.columns().attr(),
		[[1001, 3, 8], [1002, 4, 9], [1003, 5, 10], [1, 6, 11], [2, 7]],
		"Prepended data will be in the columns after we reset them"
	);

	list.prependPaused(false);
	sourceList.unshift(2001, 2002, 2003, 2004, 2005, 2006, 2007);

	QUnit.deepEqual(
		list.columns().attr(),
		[[2006, 2001, 1001, 3, 8], [2007, 2002, 1002, 4, 9], [2003, 1003, 5, 10], [2004, 1, 6, 11], [2005, 2, 7]],
		"Prepended data is added immediately"
	);
	
	
	list.setLimitAndFillColumns(17);

	firstColumn = list.columns()[0];

	QUnit.deepEqual(
		list.columns().attr(),
		[[2006, 2001, 1001, 3], [2007, 2002, 1002, 4], [2003, 1003, 5], [2004, 1, 6], [2005, 2, 7]],
		"Limit is applied to the collection"
	);

	QUnit.equal(list.columns()[0], firstColumn, 'Limit changes column lists in place');

	list.resetColumns(3);

	QUnit.deepEqual(
		list.columns().attr(),
		[[2001, 2004, 2007, 1003, 3, 6], [2002, 2005, 1001, 1, 4, 7], [2003, 2006, 1002, 2, 5]],
		"Limit is observed when resetting columns"
	);
	
	QUnit.ok(list.hasDataAfterLimit(), 'List knows when there is data that is not shown');

	list.setLimitAndFillColumns(20);

	QUnit.deepEqual(
		list.columns().attr(),
		[[2001, 2004, 2007, 1003, 3, 6, 9], [2002, 2005, 1001, 1, 4, 7, 10], [2003, 2006, 1002, 2, 5, 8]],
		"Limit can be increased"
	);

	list.setLimitAndFillColumns(Infinity);

	QUnit.deepEqual(
		list.columns().attr(),
		[[2001, 2004, 2007, 1003, 3, 6, 9], [2002, 2005, 1001, 1, 4, 7, 10], [2003, 2006, 1002, 2, 5, 8, 11]],
		"Limit can be set to infinity"
	);

	list.resetColumns(5);

	sourceList.splice(2, 0, 3000);
	sourceList.splice(13, 0, 3001);

	QUnit.deepEqual(
		list.columns().attr(),
		[[2001, 2005, 1003, 4, 9],[2002, 2006, 1, 5, 10],[3000, 2007, 2, 6, 11],[2003, 1001, 3001, 7],[2004, 1002, 3, 8]],
		"Randomly inserted data is added immediately"
	);
	
	sourceList.splice(13, 1);
	
	QUnit.deepEqual(
		list.columns().attr(),
		[[2001, 2005, 1003, 4, 9],[2002, 2006, 1, 5, 10],[3000, 2007, 2, 6, 11],[2003, 1001, 7],[2004, 1002, 3, 8]],
		"Data removed from the source list is removed from the columns"
	);
});

QUnit.test('Pausing prepend and restarting the content', function(){
	var sourceList = new can.List();
	var list = new PartitionedColumnList(sourceList);

	list.prependPaused(true);
	sourceList.unshift(1,2,3,4,5,6);

	QUnit.deepEqual(list.columns().attr(), [], "No data in columns");

	list.resetColumns(4);

	QUnit.deepEqual(
		list.columns().attr(),
		[[1, 5], [2, 6], [3], [4]],
		"Data is partitioned"
	);

	list.PER_PAGE = 2;

	list.resetColumns(4, true);

	QUnit.deepEqual(
		list.columns().attr(),
		[[1], [2], [], []],
		"Data is partitioned and limited"
	);
});

QUnit.test("Rendering", function(){
	var bits = new Bit.List();
	var cleanup = withRendered(new can.Map({
		state : new State(),
		bits : bits
	}));
	var minHeightCalculated = false;
	var bitsRequested = 0;
	var scrollHeight;
	
	$('bh-bits-vertical-infinite').on('bits:nextPage', function(){
		var start = 0;
		var end = 0;

		bitsRequested++;
		
		if(bitsRequested === 1){
			start = 20;
			end = 40;
		} else if(bitsRequested === 2) {
			start = 40;
			end = 50;
		}

		bits.push.apply(bits, fixtureData.data.slice(start, end));
	});

	$('bh-bits-vertical-infinite').one('bit:loaded', function(){
		minHeightCalculated = true;
	});

	F('bh-bit').missing('Cards are not rendered');

	F.wait(1, function(){
		$('bh-bits-vertical-infinite').scope().attr('partitionedList').PER_PAGE = 10;
		bits.push.apply(bits, fixtureData.data.slice(0, 20));
	});

	F('bh-bit').size(20, 'Initially 20 cards is rendered');

	F('bh-bits-vertical-infinite').wait(function(){
		return minHeightCalculated;
	}, 10000);
	
	F.wait(1, function(){
		scrollHeight = $('bh-bits-vertical-infinite')[0].scrollHeight;
		F('bh-bits-vertical-infinite').scroll('top', scrollHeight);
		F('bh-bit').size(40, '40 cards is rendered on scroll');
	});

	F('bh-bits-vertical-infinite').scroll('top', 0);
	F('bh-bit').size(10, 'When scrolled to top only 10 items is rendered (One page)');

	F.wait(1000, function(){
		scrollHeight = $('bh-bits-vertical-infinite')[0].scrollHeight;
		F('bh-bits-vertical-infinite').scroll('top', scrollHeight);
		F('bh-bit').size(20, '20 cards are rendered (Two pages)');
	});

	F.wait(1000, function(){
		scrollHeight = $('bh-bits-vertical-infinite')[0].scrollHeight;
		F('bh-bits-vertical-infinite').scroll('top', scrollHeight);
		F('bh-bit').size(30, '30 cards are rendered (Three pages)');
	});

	F.wait(1000, function(){
		scrollHeight = $('bh-bits-vertical-infinite')[0].scrollHeight;
		F('bh-bits-vertical-infinite').scroll('top', scrollHeight);
		F('bh-bit').size(40, '40 cards are rendered (Four pages)');
	});
	
	F.wait(1000, function(){
		scrollHeight = $('bh-bits-vertical-infinite')[0].scrollHeight;
		F('bh-bits-vertical-infinite').scroll('top', scrollHeight);
		F('bh-bit').size(50, '50 cards are rendered (New data is requested from server)');
	});

	F.wait(1, function(){
		bits.unshift({id: 'prepended1', title: 'Foo'});
		F('bh-bit').size(50, 'Prepended item is not rendered immediately because we are scrolled down');
		F('bh-bits-vertical-infinite').scroll('top', 0);
		F('bh-bit:first bh-body-wrap h4').text(/Foo/, 'Prepended item is rendered');
	});

	F.wait(1, function(){
		bits.unshift({id: 'prepended2', title: 'Bar'});
		F('bh-bit:first bh-body-wrap h4').text(/Bar/, 'Prepended item is immediately rendered because we are scrolled to top');
	});

	F.wait(1, function(){
		Bit.store = {};
		cleanup();
	});
});
