(function(twentyfiveMX, $, undefined) { // INIT Define namespace
	function AnimatedSimulator(htmlElement, url_2050Model) {
		this.element = htmlElement;
		this.sliders = {};
		this.controlsCfg = {};
		this.sounds = [];
		this.highliters = [
		                   //new createjs.ColorFilter (0,0,0,1,1,0),
		                  // new createjs.BlurFilter(5,5,1),
		                   new createjs.BlurFilter(5,5,1),
		                   new createjs.ColorFilter (1,0,0,1),
		                   ];
		this.highlight = [];
		this.highlightWait = 0;
		this.frameRate = 30	;
		this.highlightMaxWait = this.frameRate*2;
		this.cacheHS = {};
		
		this.animatedBg = false;
		
		
		/**
		 * 
		 */
		this.updateModel = function(target, value) {
			
			
			var urlModel = this.url_2050Model;
			var std = "11111111111111111111111111111111111111111111111111111";
			var strDebug = '';
			for ( var ctrName in this.sliders) {
				var slider = this.sliders[ctrName];
				var index = parseInt(ctrName);
				var value = slider.slider("option", "value");

				std = std.substr(0, index) + value + std.substr(index + 1);
				strDebug += ctrName + " = " + value + "\n";
			}

			var RandVal = Math.floor(Math.random() * 100);
			var newVal = RandVal;

			$.post(urlModel, {
				'operation' : 'data',
				'code' : std
			}).fail(function(data, textStatus, jqXHR) {
				console.log("Hubo un ERROR al contactar el servicio del modelo["
								+ urlModel + "]\n" + textStatus,std);
				console.log("Request error :", data, textStatus, jqXHR);
			}).done($.proxy(
				function(data, textStatus, jqXHR) {
					var json_model_data = data;
					var metAct = false;
					try {
						json_model_data = JSON.parse(data);
						console.log("Que sale de la simulacion : ",json_model_data);
						// TODO Esto tiene que ser
						// desde el 2010, ver si se
						// queda el parametro
						var ghgPRed = json_model_data.ghg_reduction_from_1990;
						console.log("Parseado : ****** ",ghgPRed);
						newVal = 100 - parseFloat(json_model_data.ghg_reduction_from_1990);
						
						metAct = 10;
					} catch (e_json) {
						console.log("Hubo error un al contactar el servicio del modelo["
										+ urlModel+','+std
										+ "]\n"
										+ textStatus
										+ "\nUtilizando un valor aleatorio : "
										+ newVal,data);
					}
				
					$('#debug').append(data);
					var filler = $(".meter .filler",this.element);
					$(".label", filler).text(newVal + "%");
					filler.css('width', Math.min(newVal, 99)+ "%");
				
					/*
					 * var s1 = [['No limpia',
					 * 65],['Limpia',35],]; var s2 =
					 * [['No limpia',
					 * 80],['Actual',20],];
					 */
				
					var pie_metas = $('#pie_metas').data('jqplot');
				
					var metasSerie = pie_metas.series[1];
					var metActSerie = pie_metas.series[0];
					var meta = metasSerie.data[1][1];
					metAct = (metAct!= false)?metAct:Math.floor(Math.random() * meta);
				
					metActSerie.data[1][1] = 100 - metAct;
					metActSerie.data[1][1] = metAct;
					pie_metas.replot({
						resetAxes : true
					});
					pie_metas.redraw();
					this.addMetasChartTitle($('#pie_metas'));
					this.animatedBg.update(newVal);
				}, this));
				
		};

		/**
		 * 
		 */
		this.addMetasChartTitle = function(jqElement) {
			var myTitle = $('<div>', {
				'class' : "metas-jqplot-title",
			}).insertAfter($('.jqplot-grid-canvas', jqElement));
			myTitle.html(this.getLabelFor('meta-energ-char-label'));
		};

		/**
		 * 
		 */
		this.getLabelFor = function(idLabel) {
			if (!(this.labels.hasOwnProperty(idLabel) || idLabel in this.labels)) {
				
				this.labels[idLabel] = idLabel;
				
				var node = this.xmlLabels.createElement('label');
				node.setAttribute('id',idLabel);
				node.appendChild(this.xmlLabels.createCDATASection(idLabel));
				
				var root = this.xmlLabels.getElementsByTagName('labels').item(0);
				root.appendChild(node);
				return idLabel;
			}
			return this.labels[idLabel];
		};
		/**
		 * 
		 */
		this.toggleCtrPanels = function(event) {
			var which = event.data;

			var ctrSupply = $('.supply-controls', this.element);
			var ctrDemand = $('.demand-controls', this.element);

			var openCtr = null;
			var closedCtr = null;

			switch (which) {
				case 'R' :
					openCtr = ctrSupply;
					closedCtr = ctrDemand;
					break;

				case 'L' :

					openCtr = ctrDemand;
					closedCtr = ctrSupply;
					break;
			}

			var hideDesc = closedCtr.hasClass('closed');

			ctrSupply.removeClass('open closed');
			ctrDemand.removeClass('open closed');
			openCtr.addClass('open');
			closedCtr.addClass('closed');

			$('span.label', closedCtr).hide();
			$('span.label', openCtr).show();

			if (!hideDesc)
				$('.level-description', this.element).hide();
		};

		/**
		 * 
		 */
		this.toggleSound = function() {
			var btnS = $('input.sound-ctr', this.element);

			if (btnS.hasClass('mute')) {
				for (var i = 0, sound; sound = this.sounds[i]; i++) {
					sound.resume();
				}
			} else {
				for (var i = 0, sound; sound = this.sounds[i]; i++) {
					sound.pause();
				}
			}
			btnS.toggleClass('mute');
			
			var xmlText = new XMLSerializer().serializeToString(this.xmlLabels);
			console.log("El xml de las traducciones",xmlText);
		};
		/**
		 * 
		 */
		this.showInfoWindow = function(event) {
			var obj = event.data.cfg;
			var slider = event.data.sliderUI;

			var label = this.getLabelFor(obj.id + "-label");
			var valueLabel = this.getLabelFor("info-dialog-sel-value-label");
			var value = slider.slider("option", "value")+1;
			var text = this.getLabelFor(obj.id + "-description");

			text = "<div class='ctr-curr-val'>" + "<span class='label'>"
					+ valueLabel + "</span>" + "<span class='value'>" + value
					+ "</span>" + "</div>" + "<div class='info " + obj.id
					+ "'>" + text + "</div>";
			$toShow = $('<div>', {
				title : label,
				'class' : 'control-info'
			});
			$toShow.html(text);

			$toShow.dialog({
				closeOnEscape : true,
				autoOpen : true,
				modal : true,
				width : 900,
				height : 600,
				close : function(event, ui) {
					$toShow.remove();
				},
				show : {
					effect : "fade",
					duration : 500
				},
				hide : {
					effect : "fadeOut",
					duration : 500
				}
			});
			// $('.ui-dialog-title',$toShow).html(obj.id);
			$toShow.parent().css('z-index', 9999);
			$toShow.parent().position({
				my : 'center',
				at : 'center',
				of : '.main_simulator'
			});
		};

		/**
		 * 
		 */
		this.initMeter = function() {

			var container = $('<div>', {
				'class' : 'meter-container',
			});
			var meter = $('<div>', {
				'class' : 'meter',
			});
			var filler = $('<div>', {
				'class' : 'filler',
			});
			var meterMark = $('<div>', {
				'class' : 'mark',
			});
			var meterMarkGB = $('<div>', {
				'class' : 'mark-bg',
			});

			var span = $('<span>', {
				'class' : 'label'
			}).html('100%');
			var submitBtn = $('<input>', {
				'type' : 'submit',
				'value' : this.getLabelFor('btn-submit-path-label')
			});

			var targetMark = $('<div>', {
				'class' : 'targetMark'
			});
			var targetMarkBg = $('<div>', {
				'class' : 'targetMark-bg'
			});

			container.appendTo(this.element);
			meter.appendTo(container);

			targetMarkBg.appendTo(targetMark);
			targetMark.appendTo(meter);

			filler.appendTo(meter);
			meterMark.appendTo(filler);
			meterMarkGB.appendTo(meterMark);
			span.appendTo(meterMarkGB);
			submitBtn.appendTo(meterMarkGB);

			var chartContainer = $('<div>', {
				'class' : 'pie2',
				"id" : 'pie_metas'
			});
			//chartContainer.insertBefore(meter);
			chartContainer.insertAfter(meter);

			var s1 = [[this.getLabelFor('meta-energ-meta-nolimpia'), 65],
					[this.getLabelFor('meta-energ-meta-limpia'), 35], ];
					/*[this.getLabelFor('meta-energ-actual-nolimpia'), 80],
					[this.getLabelFor('meta-energ-actual-nolimpia'), 20], ];}*/
			var s2 = [[this.getLabelFor('meta-energ-actual-nolimpia'), 80],
					[this.getLabelFor('meta-energ-actual-nolimpia'), 20], ];
			var jqplotData = [s2, s1, ];

			var plotCfg = {
				animate : true,
				animateReplot : true,
				title : {
					text : '',
					show : false,
					fontSize : '11px',
				},
				grid : {
					borderColor : 'transparent',
					shadow : false,
					drawBorder : false,
					borderWidth : 0,
					shadowColor : 'transparent',
					background : 'transparent',
				},
				highlighter : {
					show : true,
					showMarker : false,
					sizeAdjust : 0,
					tooltipLocation : 'sw',
					useAxesFormatters : false,

					tooltipAxes : 'xy',
					formatString : '%s %2d%',
				},
				/*seriesDefaults: {
			        // Make this a pie chart.
			        renderer: jQuery.jqplot.PieRenderer, 
			        rendererOptions: {
			        	//fillAlpha: .5,
			        	animation : {
							show : true
						},
						varyBarColor : true,
						sliceMargin : 1,
						startAngle : 40,
						fill : false,
						showDataLabels : false,
						padding : 10,
						shadowAlpha : 0,
						innerDiameter : 15,
						dataLabels : 'value',
			          // Put data labels on the pie slices.
			          // By default, labels show the percentage of the slice.
			          showDataLabels: false
			        },
			        
			        
			        //startAngle : 45,	
			      },*/
			      
				
				seriesDefaults : {
					// make this a donut chart.
					seriesColors : ['orange', '#000099'],
					renderer : $.jqplot.DonutRenderer,
					rendererOptions : {
						animation : {
							show : true
						},
						varyBarColor : true,
						// Donut's can be cut into slices like pies.
						sliceMargin : 1,
						// Pies and donuts can start at any arbitrary angle.
						startAngle : 0,
						showDataLabels : false,
						// By default, data labels show the percentage of the
						// donut/pie.
						// You can show the data 'value' or data 'label'
						// instead.
						dataLabels : 'value',
						padding : 10,
						shadowAlpha : 0,
						innerDiameter : 15,
					},
				}, 
				
				series : [{}, {
					seriesColors : ['red', 'green'],
				}, ],

			};

			var jqplotB = $.jqplot('pie_metas', jqplotData, plotCfg);
			chartContainer.data('jqplot', jqplotB);
			this.addMetasChartTitle($(chartContainer));
			
			
			//var parentDiv = $("#pie_metas");
			var parentDiv = $("#superContainerDiv");
			var canvas = $(".jqplot-series-canvas");
			/*var canvas1 = $(".jqplot-base-canvas");
			var canvas2 = $(".jqplot-grid-canvas");
			var canvas3 = $(".jqplot-series-canvas");
			var canvas4 = $(".jqplot-series-shadowCanvas");
			var canvas5 = $(".jqplot-donutRenderer-highlight-canvas");
			var canvas6 = $(".jqplot-highlight-canvas");*/
				//alert(canvas.offset().left + "," + canvas.offset().top);
				//alert(parentDiv.width() + "," + canvas.offset().left);
		
			parentDiv.append('<div id="nuevecito" style="offset-top:' + canvas.offset().top + '; offset-left:' + canvas.offset().left + ';"><img src="assets/meter/glass.png"/></div>');
		
			//var context = canvas.getContext('2d');
			//var context = canvas1.getContext('2d');
			//var context = canvas2.getContext('2d');
			//var context = canvas3.getContext('2d');
			//var context = canvas4.getContext('2d');
			//var context = canvas5.getContext('2d');
			//var context = canvas6.getContext('2d');
		
				
				/*$('<div/>', {
				    class: '100px',
				    z-index: '1000'
				}).appendTo('.animated-bg');*/
					//height: '100px',
					//background: 'red',
					//-moz-border-radius: '50px',
					//-webkit-border-radius: '50px',
					//border-radius: '50px'
					//position: 'absolute'
					//top : canvas.offset().top,
					//left: canvas.offset().left
				
				/*var context = canvas.getContext('2d');
				context.beginPath();
			  	
			  	context.arc(canvas.width / 2, canvas.height / 2, canvas.width / 4, 0, 2 * Math.PI, false);
			  	
			  	context.fillStyle = 0.5;
			 	context.fill();
			  	context.lineWidth = 0;
			  	context.strokeStyle = "rgba(255,0,0,0.5)";
			  	context.stroke();
			  	*/
				
		};

		/**
		 * 
		 */
		this.initAnimatedBackground = function() {
			var divBg = $("<div>",{'class':'animated-bg'}).appendTo(this.element);
			
			var img1 = this.loader.getResult('animated-bg-1');
			var img2 = this.loader.getResult('animated-bg-2');
			var img3 = this.loader.getResult('animated-bg-3');
			var img4 = this.loader.getResult('animated-bg-4');
			
			divBg.append(img1,img2,img3,img4);
			
			$(img1).addClass('animated-bg-1');
			$(img2).addClass('animated-bg-2');
			$(img3).addClass('animated-bg-3');
			$(img4).addClass('animated-bg-4');
			
			var images = [$(img1),$(img2),$(img3),$(img4)];
			
			divBg.update = function (reductionPer){
				reductionPer = (reductionPer<=50)?0:2*(reductionPer-50);
				var sliceLength = 100/images.length;
				var debug = [];
				for(var i = 0 ; i < images.length; i++){
					var currImg =  images[i];
					var opacity =  reductionPer-sliceLength*i;
					opacity = (opacity <= 0)?0:Math.min(1,opacity/sliceLength);
					currImg.css('opacity',opacity);
					debug.push(opacity);
				}
				
				console.log("Opacidades : ",sliceLength,debug);
			};
			this.animatedBg = divBg;
		};
		
		/**
		 * 
		 */
		this.initAnimation = function(sprites) {
			
			var stage, w, h;
			var loader = this.loader;
			
			var canvas =
			$('<canvas id="simulation" width="950px" height="450px">El navegador no soporta el tag canvas</canvas>').appendTo(this.element);
			stage = new createjs.Stage("simulation");
			//stage = new createjs.SpriteStage("simulation",true, false);

			// grab canvas width and height for later calculations:
			w = stage.canvas.width;
			h = stage.canvas.height;

			for ( var idSp in sprites) {
				var currSp = sprites[idSp];
				if(idSp != 'islas')
					currSp.visible = false;
				stage.addChild(currSp);
			}

			this.stage = stage;
			createjs.Ticker.setFPS(this.frameRate);
			createjs.Ticker.addEventListener("tick", stage);
			this.sounds.push(createjs.Sound.play('sound-bg-bird', {
				"loop" : '-1'
			}));
		};

		
		
		/**
		 * 
		 */
		this.onTickHighlight = function(event){
			//console.log("Que tenemos para actualizar : ",this.highlightWait);
			if(this.highlightWait < -2){
				this.highlightWait = 0;
				if(this.highlight.length > 0){
					this.removeHighligths();
				}
				createjs.Ticker.removeEventListener('tick',this.onTickHighlightProxy);
				return;
			} 
		
			this.highlightWait--;
			var value = this.highlightWait/this.highlightMaxWait;
			value = Math.max((1+Math.sin(2*Math.PI*value))/2,0);
			for(var idx = 0, currHSp; currHSp = this.highlight[idx];idx++){
				currHSp.alpha = value;
			}
		};
		this.onTickHighlightProxy = $.proxy(this.onTickHighlight,this);
		
		/**
		 * 
		 */
		this.removeHighligths = function (){
			for(var idx = 0, currHSp; currHSp = this.highlight[idx];idx++)
				this.stage.removeChild(currHSp);
			this.highlight = [];
		};
		
		/**
		 * 
		 */
		this.getHighligthFor = function(displayObject){
			var hlSp = {};
			
			if(displayObject.hasOwnProperty('spriteSheet')){
				var images = [];
				var ss = displayObject.spriteSheet;
				var orig = ss.originalCfg;
				for(var i = 0,img;img = orig.images[i];i++){
					var bmpCache = null;
					if(!this.cacheHS[img.src]){
						console.log("No esta en el cahce : ",img.src);
						var bmp = new createjs.Bitmap(img);
						bmp.filters = this.highliters;
						bmp.cache(0,0,img.width,img.height);	
						this.cacheHS[img.src] = bmp.cacheCanvas
					}
					
					bmpCache = this.cacheHS[img.src];
					images.push(bmpCache);
				}
				
				var newSS =  new createjs.SpriteSheet({
					"images"	: images, // Note we are using the bitmap's cache
					"frames"	: orig.frames,
					"animations": orig.animations
				});
				
				hlSp = displayObject.clone();
				hlSp.spriteSheet = newSS;
				hlSp.x -=2;
				hlSp.y -=3;
			} else {
				hlSp = displayObject.clone();
				hlSp.filters = this.highliters;
				hlSp.cache(0,0,hlSp.image.width,hlSp.image.height);
			}
			return hlSp;
		};
		/**
		 * 
		 */
		this.initControls = function() {

			var container = $('<div>', {
				'class' : 'controls'
			}).appendTo(this.element);
			var energyBalancePane = $('<div>', {
				'class' : 'energy_balance'
			}).appendTo(container);

			var ctrSupplyLabel = $('<div>', {
				'class' : 'supply-controls-label control-title'
			}).appendTo(container);
			var ctrSupply = $('<div>', {
				'class' : 'supply-controls'
			}).appendTo(container);
			var ctrDemand = $('<div>', {
				'class' : 'demand-controls'
			}).appendTo(container);
			var ctrDemandLabel = $('<div>', {
				'class' : 'demand-controls-label control-title'
			}).appendTo(container);
			var uiControlsCfg = [{
				label : 'Supply',
				ctrsIdArray : 'supply',
				container : ctrSupply,
				labelCont : ctrSupplyLabel
			}, {
				label : 'Demand',
				ctrsIdArray : 'demand',
				container : ctrDemand,
				labelCont : ctrDemandLabel
			}, ];

			/**
			 * 
			 */
			var fUpdateModel = $.proxy(function(event, ui,noUpdateFromExcel) {
				var target = $(event.target);
				var sliderData = (target.data())['lever'];
				//console.log("Cambiamos Lever : ",sliderData);
				var currVal = ui.value + 1;
				
				
				var spritesToUpdate = this.getSpritesFromLeverId(sliderData.id);
				this.removeHighligths();
				
				for(var idSp in spritesToUpdate){
					var currSp = spritesToUpdate[idSp];
					var spCfg = currSp.cfg;
					var toHighlght  = true;
					if(spCfg.sublevel == sliderData.id){
						currSp.gotoAndPlay('level_'+ui.value);
					} else {
						var makeVisible = $.inArray(currVal,spCfg.forLevel)>-1
						currSp.visible = makeVisible;
						toHighlght = makeVisible;
					}
					
					if(false && toHighlght && currSp.visible && !noUpdateFromExcel){
						var hlSp	= this.getHighligthFor(currSp);
						var idxAt	= this.stage.getChildIndex(currSp)+1; 
						this.stage.addChildAt(hlSp,idxAt);
						this.highlight.push(hlSp);
					}
				}
				
				if(noUpdateFromExcel)
					return;
				
				this.highlightWait = this.highlightMaxWait;
				createjs.Ticker.addEventListener('tick',this.onTickHighlightProxy);
				this.updateModel(event.target, ui.value);
			}, this);

			var defLevelDesc = {
				'levels' : [{
					description : 'No desc'
				}, {
					description : 'No desc'
				}, {
					description : 'No desc'
				}, {
					description : 'No desc'
				}]
			};
			var fOnSlide = function(event, ui) {
				// Show lever level info
				var target = $(event.target);
				var value = ui.value;
				var sliderData = (target.data())['lever'] || defLevelDesc;
				//alert(sliderData);
				var dialogMsg = $('.level-description');
				dialogMsg.html("Value : "
						+ value
						+ "<br>"
						+ this.getLabelFor(sliderData.id + '-info-level-'
								+ value));
						//+ "<br/> sliderData.value " + JSON.stringify(sliderData) );

				if (!dialogMsg.is(":visible")) {
					var ctrClosed = $(".controls .closed");
					dialogMsg.show();
					dialogMsg.width(ctrClosed.width() - 10);
					dialogMsg.height(ctrClosed.height() - 10);

					dialogMsg.position({
						of : ctrClosed,
						my : 'center',
						at : 'center',
					});
				}

				// Play lever FX
				createjs.Sound.play('lever');
			};
			for ( var idx in uiControlsCfg) {
				var currCfg = uiControlsCfg[idx];
				var ctrsCfg = this.controlsCfg[currCfg.ctrsIdArray];
				var containerInt = currCfg.container;
				var txt = this.getLabelFor(this.controlsCfg.labels[currCfg.ctrsIdArray]);
				currCfg.labelCont
						.html("<span>"+txt+"</span>");

				var cont = 0;
				for (var name in ctrsCfg) {
					var obj = ctrsCfg[name];
					obj.id = name;
					var sliderC = $(
							'<div>',
							{
								'id' : 'container-' + name,
								'class' : 'twentyfive-slider-container control-'
										+ name,
							});
					sliderC.appendTo(containerInt);
					var toUp = (obj.hasOwnProperty('direction') && obj.direction == 'down')
							? 'max'
							: 'min';

					var $slider = $('<div>', {
						'id' : name,
					});
					var currVal = obj.value-1;
					$slider.appendTo(sliderC);
					$slider.data('lever', obj);
					slider = $slider.slider({
						orientation : "vertical",
						range : toUp,
						value : currVal,
						min : 0,
						max : 3,
						step : 1,
						stop : fUpdateModel,
						slide : $.proxy(fOnSlide, this),
					});
					
					$('.ui-slider', slider).removeClass('ui-corner-all');
					this.sliders[name] = slider;
					var label = $('<span>', {
						'class' : 'label',
					});
					label.appendTo(sliderC);
					var anchor = $('<a>', {});

					anchor.on('click', {
						sliderUI : slider,
						cfg : obj
					}, $.proxy(this.showInfoWindow, this));
					anchor.html(this.getLabelFor(obj.id + "-label"));
					label.append(anchor);
					cont++;
					
					fUpdateModel({target:$slider.get(0)},{value:currVal},true);
				}
				var porc = Math.floor((90 / cont)) + '%';
				$('.twentyfive-slider-container', containerInt).css('width',
						porc);
			}

			ctrSupply.on('mouseenter', null, 'R', $.proxy(this.toggleCtrPanels,
					this));
			ctrDemand.on('mouseenter', null, 'L', $.proxy(this.toggleCtrPanels,
					this));
			ctrSupply.trigger('mouseenter');

			var fNoInfo = function() {
				$('.level-description').hide();
			};

			ctrSupply.on('mouseleave', fNoInfo);
			ctrSupply.on('mouseleave', fNoInfo);

			// Energy balance

			var btnToggleBalance = $('<div>', {
				'class' : 'open_btn'
			}).appendTo(energyBalancePane);
			btnToggleBalance.on('click', function() {

				$('canvas#simulation').toggleClass('minified');
				$('div.energy_balance .energy_chart').toggleClass('maxified');
				console.log("Cambiando el asunto");
			});

			$('<span>', {
				'class' : 'energy_balace_state under'
			}).appendTo(btnToggleBalance);
			var label = $('<span>', {
				'class' : 'btn_energy_label'
			}).appendTo(btnToggleBalance);
			$('<span>', {
				'class' : 'energy_balace_state under'
			}).appendTo(btnToggleBalance);

			var text = this.getLabelFor('energy-balance-pane-title');
			label.html(text);

			var chartPane = $('<div>', {
				'class' : 'energy_chart'
			}).appendTo(energyBalancePane);
			var chartContainer = $('<div>', {
				'class' : 'chart-content'
			}).appendTo(chartPane);

			var jqplotData = [[100, 80], [80, 20], ];
			var plotCfg = {
				seriesDefaults : {
					renderer : $.jqplot.BarRenderer,
					rendererOptions : {
						barDirection : 'horizontal',
						barPadding : 2,
						barWidth : 10,
						shadowDepth : 2,
					},
				},
				series : [{
					label : 'Demanda',
				}, {
					label : 'Oferta',
				}, ],
				axes : {
					xaxis : {
						showTicks : false,
					// showTicksMarks:false,
					},
					yaxis : {
						renderer : $.jqplot.CategoryAxisRenderer,
						ticks : ["Electricidad p", 'Combustible'],
						tickRenderer : $.jqplot.CanvasAxisTickRenderer,
						tickOptions : {
							showMark : false,
							fontFamily : 'Arial, SansSerif',
							fontSize : '12pt',
							angle : -45,
							textColor : '#FFF',
							labelPosition : 'middle',
							showGridline : false,
						},
					},
				},
				grid : {
					show : false,
					shadow : false,
					drawBorder : false,
					drawGridlines : false,
					background : 'rgba(0,0,0,0)',
					borderWidth : 4,
				},
				legend : {
					renderer : $.jqplot.EnhancedLegendRenderer,
					show : true,
					placement : 'outsideGrid',
					rendererOptions : {
						numberRows : 1,
					},
					location : 'n',
				},
			};

			var jqplotB = chartContainer.jqplot(jqplotData, plotCfg);
			$('table', chartContainer).css('left', 0).css('top', 0);

			// To mute the bg FX
			var infoPane = $('<div>', {
				'class' : 'info-pane',
			}).appendTo(this.element);
			var btnS = $('<input>', {
				'type' : 'button',
				'class' : 'sound-ctr'
			}).appendTo(infoPane);
			btnS.on('click', $.proxy(this.toggleSound, this));

			// Para los dialogos
			$('<div>', {
				'class' : 'level-description'
			}).appendTo(container).hide();
		};

		/**
		 * 
		 */
		this.preloadAssets = function(completeHandler, progressHandler, errorHandler) {
			if (!this.loader) {
				this.loader = new createjs.LoadQueue(true);
				createjs.Sound.alternateExtensions = ["mp3", 'ogg', 'wav'];
				this.loader.installPlugin(createjs.Sound);
				this.loader.on("complete", completeHandler);
				this.loader.on("progress", progressHandler, this);
				this.loader.on("error", errorHandler);
				
				var handleFileLoad = $.proxy(function (event){
					return;
					if(event.item.type != createjs.LoadQueue.IMAGE) {
						return;
					}
					
					var img = event.item.tag;
					var bmpCache = null;
					if(!this.cacheHS[img.src]){
						var bmp = new createjs.Bitmap(img);
						bmp.filters = this.highliters;
						bmp.cache(0,0,img.width,img.height);	
						this.cacheHS[img.src] = bmp.cacheCanvas
					}
				},this);
				
				this.loader.on("fileload", handleFileLoad);
			}

			this.loader.loadManifest(assetsManifest);
		};

		/**
		 * 
		 */
		this.init = function() {
			var loading = $("<div>", {
				id : 'loading'
			}).appendTo(this.element);
			loading.progressbar({
				value : 1
			});

			var progressHandler = function(event, data) {
				$("#loading", this.element).progressbar("option", {
					value : 100 * event.progress
				});
			};

			var completeHandler = function(event) {
				console.log("*************************COMPLETE");
				// LEVERS
				this.controlsCfg = this.loader.getResult('leversConfig');
				//console.log("Configuracion palancas:",this.controlsCfg);
				var listLabels = this.loader.getResult('labelsConfig');
				if (!this.controlsCfg) {
					alert("No se encontró la configuracion controlsCfg: \n : file : assets/configLabels.xml");
					return;
				}
				if (!listLabels) {
					alert("No se encontró la configuracion de las etiquetas: \n : file : assets/configLabels.xml");
					return;
				}
				this.xmlLabels = listLabels;
				listLabels = listLabels.getElementsByTagName('label');
				this.labels = {};
				for (var i = 0; i < listLabels.length; i++) {
					var node = listLabels[i];
					this.labels[node.getAttribute('id')] = node.textContent
							.trim();
				}
				
				
				this.url_2050Model = this.controlsCfg.url_model
						|| 'getPathway.php';

				// ANIMATIOS
				var order = this.loader.getResult('animationLayerConfig');
				console.log("Que tenemos en la configuracion : ", order);
				var sprites = {};
				for (var layerID = order.length - 1; layerID > -1; layerID--) {
					var currCfg = order[layerID];
					var object = null;
				
					if (currCfg.type != 'animated') {
						var loadedImg = this.loader.getResult(currCfg.id);
						if(loadedImg){
							object = new createjs.Bitmap(loadedImg);
						}else{
							console.log("No se encontro la capa estatica : ",currCfg.id);
							continue;
						}
					} else {
						var jsonId = 'sprite_json_' + currCfg.id;
						var tmpCfg = this.loader.getResult(jsonId);
						if (!tmpCfg) {
							console.log("No se encontro la capa animada : ",jsonId);
							continue;
						}
						if(!tmpCfg.images){
							console.log("No se encontro el arreglo de imagenes : ["+jsonId+"] \n",tmpCfg);
							continue;
						}
						
						var loadedImages = [];
						for(var j = 0 ; j < tmpCfg.images.length; j++ ){
							var src_img = tmpCfg.images[j];
							var loadImg = src_img;
							if(src_img.lastIndexOf){
								var idxP = src_img.lastIndexOf('.');  
								src_img = src_img.substring(0,idxP);
								var loadImg = this.loader.getResult(src_img);
							}
							if(!loadImg){
								console.log("No se pudo cargar la imagen : ",src_img);
								continue;
							}
							loadedImages.push(loadImg);
						}
						
						if(tmpCfg.animations){
							tmpCfg.images		= loadedImages;
							var ssData			= new createjs.SpriteSheet(tmpCfg);
							ssData.originalCfg	= tmpCfg;
							object = new createjs.Sprite(ssData, Object.keys(tmpCfg.animations)[0]);	
						} else {
							console.log("No se encontraron las animaciones en el spritesheet: ["+jsonId+"] \n",tmpCfg);
							continue;
						}
						
					}
					object.x = currCfg.x;
					object.y = currCfg.y;
					object.cfg = currCfg;
					var count = 0;
					var idSp = currCfg.id;
					while(sprites[idSp]){
						count++;
						idSp = currCfg.id+'_'+count;
					}
					
					sprites[idSp] = object;
				}

				this.sprites = sprites;
				this.initAnimatedBackground();
				this.initMeter();
				this.initAnimation(sprites);
				this.initControls();
				$("#loading", this.element).remove();
				event.target.removeEventListener('progress', progressHandler,
						true);
				this.updateModel();
			};

			var errorHandler = function(event) {
				console.log("Error al cargar. Que tenemos : ", event.item.id,event.item.src);
			}

			completeHandler = $.proxy(completeHandler, this);
			progressHandler = $.proxy(progressHandler, this);

			this.preloadAssets(completeHandler, progressHandler, errorHandler);
		};
		
		
		/**
		 * 
		 */
		this.getSpritesFromLeverId = function(leverId){
			var result = {};
			for(var spId in this.sprites){
				var currSp = this.sprites[spId];
				var cfg = currSp.cfg;
				if(cfg.leverID == leverId || cfg.sublevel == leverId ){
					result[spId] = currSp;	
				}
			}
			return result;
		};
	};

	twentyfiveMX.AnimatedSimulator = AnimatedSimulator;
}(window.twentyfiveMX = window.twentyfiveMX || {}, jQuery));// END Define
															// namespace

$(function() {
	if (!String.prototype.trim) {
		String.prototype.trim = function() {
			return this.replace(/^\s+|\s+$/g, '');
		};
	}
	var simulator = new twentyfiveMX.AnimatedSimulator($('.main_simulator'));
	simulator.init();
	
	window.simulator = simulator; 
});
