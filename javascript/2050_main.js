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
		this.sharePathWay = function (){
			var urlToShare = this.getUrlToShare();
			console.log("Que tenemos para compartir ? ",urlToShare);
			
			// Check energy balance before show share dialog 			
			var icons = $('.open_btn > span.energy_balace_state');
			var $toShow = '';
			var valid = !icons.hasClass('under'); 
			
			if(valid){ // no share, no enogh supply
				//All good, show share dialog
				var services = [
	                'facebook',
	                'twitter',
	                'googleplus',
	                ];
				
				
				this.getLabelFor('share-path-dialog-title');
	
				var $share = $(
					'<div class="shareThis">\
					<p class="description">'+this.getLabelFor('share-path-dialog-description')+'</p>\
					<div class="share-widgets-container"></div>\
					</div>'
				);
				
				var $shareWidgets = $('.share-widgets-container',$share).get(0);
				
				
				var txtshareTitle	= this.getLabelFor('share-path-dialog-link-title');
				var txtshareSumary	= this.getLabelFor('share-path-dialog-link-summary');
				var txtshareText	= this.getLabelFor('share-path-dialog-link-text');
				
				for(var i = 0 ; i < services.length; i++){
					stWidget.addEntry({
						element	: $shareWidgets,
						service	: services[i],
						url		: urlToShare,
						title	: txtshareTitle,
						type	: "large",
						text	: txtshareText ,
						//image	: "http://www.softicons.com/download/internet-icons/social-superheros-icons-by-iconshock/png/256/sharethis_hulk.png",
						summary	: txtshareSumary   
					});
				}
				$toShow = $share;
				$toShow.dialogTitle = this.getLabelFor('share-path-dialog-title');
				$toShow.dialogButtons = [];
			} else { //Not balanced 	
				
				var txtEnergybalance = this.getLabelFor('warning-energy-balance-on-share');
				var $toShow = $('<div>'+txtEnergybalance+'</div>');
				$toShow.dialogTitle = this.getLabelFor('warning-energy-balance-window-title');
				$toShow.dialogButtons = [{
					  text: this.getLabelFor('warning-energy-balance-on-share-exit'),
					  icons: {
						  primary: "ui-icon-circle-arrow-w"
					  },
					  click: function() {
						  $( this ).dialog( "close" );
					  }
				}];
			} 
			
			
			$toShow.dialog({
				title : $toShow.dialogTitle,
				autoOpen		: true,
				modal			: true,
				draggable		: false,
				width : 500,
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
				},
				buttons : $toShow.dialogButtons,
			});
			$toShow.parent().position({
				my : 'center',
				at : 'center',
				of : '.main_simulator'
			});
			
		}
		
		/**
		 * 
		 */
		this.updateVisualComponents = function(json_model_data){
			
		
			//console.log("QUE DATOS NOS LLEGAN  : ",json_model_data);
			
			
			/* *********************************************
			 * UPDATE GHG REDUCTION 
			 * *********************************************
			 */
			
			var ghgPRed = json_model_data.ghg_reduction_from_2000;
			var newVal = 100*(1 - parseFloat(json_model_data.ghg_reduction_from_2000));

			var filler = $(".meter .filler",this.element);
			var roundVal = Math.round(newVal);
			$(".label", filler).text(roundVal);
			
			var fillVal = 100*(newVal/150);
			fillVal = Math.min(fillVal, 100);
			if(fillVal < 100){
				filler.removeClass('overflow');
			} else {
				filler.addClass('overflow');
			}
			
			filler.css('width', fillVal + "%");
			
			/*
			 * ****************************************************
			 * CHANGE BACKGORUND AND RELEASE SHARE BUTTON 
			 * ****************************************************
			 */
			this.animatedBg.update(newVal);
			var ghgGol = this.controlsCfg.ghg_reduction_gol_percentage;
			var btnEnabled = (roundVal <= ghgGol);
			var sharePWBtn = $('button.send-pathway-btn');
//			console.log("Vamos a activar el boton : ",btnEnabled,sharePWBtn);
			//sharePWBtn.attr('disabled', (!btnEnabled)?'disabled':false);
			if(btnEnabled)
				sharePWBtn.show('highlight',{},1000);
			else 
				sharePWBtn.hide('drop',{},1000);
			/* *************************************************
			 * UPDATE ENERGY GOL 
			 * *************************************************
			 */
			/** 
			 * Energias limpias
		 		electricity->supply->
			 		2050 -> indice 9 de los arreglos,
			 		100*((TODAS MENOS {'Convencional', 'CSS'}/'Total'))
			 * 
			 */
			var metAct = json_model_data.electricity.supply;
		
//			console.log("Meta energetica ? :",metAct);
			var idx2050 = 9;
			var maxIdx = metAct.length -1;
			var supplyTotal = metAct[maxIdx][idx2050];
			var sumProdClean = 0;
			var toSum = this.controlsCfg.clean_energy_search_labels;
			
			
			for(var i = maxIdx -1; i >= 1; i--){
				var currLabel = metAct[i][0];
				var esta = $.inArray(currLabel,toSum); 
				if ( esta > -1){
					var currValue = metAct[i][idx2050];
					sumProdClean += currValue;
				}
			}
			metAct = 100*sumProdClean/supplyTotal;
			
			var pie_metas = $('#pie_metas').data('jqplot');
		
			
			console.log("Que datos tenemos en el pir ",pie_metas.series);
			var metasSerie = pie_metas.series[1];
			var metActSerie = pie_metas.series[0];
			var meta = this.controlsCfg.clean_energy_meta;
			/*if(metAct == false){
				metAct = Math.floor(Math.random()* meta);
			}
		*/
			metActSerie.data[1][1] = metAct;
			pie_metas.replot({ resetAxes : true });
			pie_metas.redraw();
			this.addMetasChartTitle($('#pie_metas'));
			
			
			var energy_balance = $('#energy-balance-chart').data('jqplot');
			var supplySerie = energy_balance.series[1];
			var demandSerie = energy_balance.series[0];
			
			//To match the origin of tow pies 
			$('#pie_metas > canvas:nth-child(8)').css('top',12).css('left',12);
			
			console.log("Actualizando el balance : ",energy_balance.series);
			
			// ELectricity
			var dataDemand = json_model_data.electricity.demand;
			var dataSupply = json_model_data.electricity.supply;
			
			dataDemand = dataDemand[dataDemand.length-1];
			dataDemand = dataDemand[dataDemand.length-1];
			
			dataSupply = dataSupply[dataSupply.length-1];
			dataSupply = dataSupply[dataSupply.length-1];
			
			supplySerie.data[0][0] = dataSupply;
			demandSerie.data[0][0] = dataDemand;
			
			
			
			// Fuel
			var globalDemmand = json_model_data.final_energy_demand;
			var globalSupply = json_model_data.primary_energy_supply;
			
			globalDemmand	= globalDemmand[globalDemmand.length-1];
			globalSupply	= globalSupply[globalSupply.length-1];
			
			globalDemmand	= globalDemmand[globalDemmand.length-1];
			globalSupply	= globalSupply[globalSupply.length-1];
			
			supplySerie.data[1][0] = globalSupply;
			demandSerie.data[1][0] = globalDemmand;
			
			energy_balance.replot({ resetAxes : true });
			energy_balance.redraw(); 
			
			
			/*
			 * CHANGE ICONS ON ENERGY BALANCE
			 * 
			 */
			var balanceN = globalDemmand/globalSupply;
			var iconEnergyClass = 'balanced';
			
			var maxVar = this.controlsCfg.max_energy_balance_overdemmand_percentage;
			
			maxVar = (100 - maxVar)/100;
			
			if(balanceN > 1 ) {
				iconEnergyClass = 'under';
			} else if(balanceN < maxVar ){ // 20% more supply
				iconEnergyClass = 'upper';
			}
			
			var icons = $('.open_btn > span.energy_balace_state')
			icons.removeClass('under upper balanced');
			icons.addClass(iconEnergyClass);
		}
		
		
		
		/**
		 * 
		 */
		this.updateModel = function(target, value) {
			
			var urlModel = this.url_2050Model;
			var std = this.controlsCfg.default_pathway;
			var strDebug = '';
			for ( var ctrName in this.sliders) {
				var slider = this.sliders[ctrName];
				var cfg = slider.data('lever');
				var value = slider.slider("option", "value");
				var levelCfg = cfg.levels[value];
				
				for(var idxPath in levelCfg){
					var index	= parseInt(idxPath);
					var pathVal	= parseInt(levelCfg[idxPath]); 
					std = std.substr(0, index) + pathVal + std.substr(index + 1);
				}
				strDebug += ctrName + " = " + value + "\n";
			}

			var RandVal = Math.floor(Math.random() * 150);
			var newVal = RandVal;
			var fakeModel = new ModelFakeResultTest();
			var $updateAux = $.proxy(this.updateVisualComponents,this);
			
			$.post(urlModel, {
				'operation' : 'data',
				'code' : std
			}).fail(function(data, textStatus, jqXHR) {
				console.log("Hubo un al contactar el servicio del modelo["
								+ urlModel + "]\n" + textStatus,std);
				console.log("Request error :", data, textStatus, jqXHR);
				$updateAux(fakeModel.getResult());
			}).done( function(data, textStatus, jqXHR) {
				var json_model_data = data;
				var metAct = false;
				try {
					json_model_data = JSON.parse(data);
				//	console.log("Que sale de la simulacion : ",json_model_data);
					$updateAux(json_model_data);
				} catch (e_json) {
				//	console.log("Hubo error un al contactar el servicio del modelo URL : ", urlModel);
				//	console.log("\t std,textStatus", std,textStatus);
				//	console.log("Exception : ",e_json);
					$updateAux(fakeModel.getResult());
				}
			});
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
			var tabsWindow = $('#horizontalTab');
			var idTab = '#anchor-tab-'+event.data.cfg.id
			$(idTab,tabsWindow).click();
			tabsWindow.show();
			console.log("Mostrando la info del tab : ",event);
			
			
			tabsWindow.position({
		          of: this.element,
		          my: 'top center',
		          at: 'top center',
		          collision: 'fit',
		        });
			
			
			/*
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
			*/
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
			}).html('100');
			
			var submitBtn = $('<button>', {
				'type' : 'submit',
				'class' : 'send-pathway-btn',
			}).html(this.getLabelFor('btn-submit-path-label'));
			submitBtn.on('click', $.proxy(this.sharePathWay,this));
			
			
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
			
			
			submitBtn.insertAfter(meter);

			var chartContainer = $('<div>', {
				'class' : 'pie2',
				"id" : 'pie_metas'
			});
			chartContainer.insertBefore(meter);

			var s1 = [
			          [this.getLabelFor('meta-energ-meta-nolimpia'), 65],
			          [this.getLabelFor('meta-energ-meta-limpia'), 35], 
			         ];
			var s2 = [
			          [this.getLabelFor('meta-energ-actual-nolimpia'), 80],
			          [this.getLabelFor('meta-energ-actual-limpia'), 20], 
			         ];
			
			var jqplotData = [s1 ,s2];

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
					tooltipLocation : 'se',
					useAxesFormatters : false,

					tooltipAxes : 'xy',
					formatString : '%s %2d%',
				},
				seriesDefaults : {
					// make this a donut chart.
					seriesColors : ['rgba(255,255,0,0.0)','rgb(50,200,50)'],
					 lineWidth: 2,
					//renderer : $.jqplot.DonutRenderer,
					renderer : $.jqplot.PieRenderer,
					rendererOptions : {
						animation : {
							show : true,
							speed: 2500
						},
						varyBarColor : true,
						// Donut's can be cut into slices like pies.
						sliceMargin : 0,
						// Pies and donuts can start at any arbitrary angle.
						startAngle: -90,
						showDataLabels : false,
						// By default, data labels show the percentage of the
						// donut/pie.
						// You can show the data 'value' or data 'label'
						// instead.
						dataLabels : 'value',
						padding : 10,
						shadowAlpha : 0,
						innerDiameter : 20,
					},
				},
				series : [
					{
						rendererOptions : {
							innerDiameter : 15,
						}
					}, 
				    {
						seriesColors : ['rgba(255,0,0,0.0)','rgba(255,80,80,0.8)'],
						rendererOptions : {
							fill : false,
						},
					}, 
				],

			};

			var jqplotB = $.jqplot('pie_metas', jqplotData, plotCfg);
			chartContainer.data('jqplot', jqplotB);
			this.addMetasChartTitle($(chartContainer));

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
				
//				console.log("Opacidades : ",sliceLength,debug);
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
						//console.log("No esta en el cahce : ",img.src);
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
		 * Init lever's info pane 
		 */
		this.initExtraInfo = function(uiControlsCfg) {
			var tabContainer = $('<div>', {'id' : 'horizontalTab'});	
			var menuUl = $('<ul>');
			var closeDiv = $('<a>', {'html' : 'X','class':'btn-close'});
			
			closeDiv.on('click', function(){
				$('#horizontalTab').hide();
			});
			
			var masInfo = $('<div>', {'html':'Informaci&oacute;n complementaria','class':'title'});
			masInfo.append(closeDiv);
			

			for ( var idx in uiControlsCfg) {
				var currCfg = uiControlsCfg[idx];
				var ctrsCfg = this.controlsCfg[currCfg.ctrsIdArray];
				var addClass	= (idx == 0)?'oferta-class'    : 'demanda-class';
				var addClassLi	= (idx == 0)?'oferta-class-li' : 'demanda-class-li';
				
				for (var name in ctrsCfg) {
					var obj = ctrsCfg[name];
					obj.id = name;
					var labelTab = this.getLabelFor(obj.id + "-label");
					var text = this.getLabelFor(obj.id + "-description");
					var currLiAn = $('<a>', {
						'href'	: '#tab-' + obj.id, 
						'html'	: labelTab, 'class':addClassLi,
						'id'	: 'anchor-tab-'+ obj.id,
					});
					var currLi = $('<li>');
					currLi.append(currLiAn);
					var currDesc = $('<div>', {'id': 'tab-' + obj.id, 'class': addClass});
					currDesc.append(text);
					
					menuUl.append(currLi);
					tabContainer.append(currDesc);
				}
			}
			
			tabContainer.prepend(menuUl);
			tabContainer.prepend(masInfo);
			
			$('body').append(tabContainer);
			            
			//var $tabs = $('#horizontalTab');
            console.log(tabContainer);
           // alert('ALGO');
            tabContainer.responsiveTabs({
                rotate: false,
                startCollapsed	: 'accordion',
                collapsible		: 'accordion',
                setHash: true,
                activate: function(e, tab) {
                    $('.info').html('Tab <strong>' + tab.id + '</strong> activated!');
                },
                activateState: function(e, state) {
                    //console.log(state);
                    $('.info').html('Switched from <strong>' + state.oldState + '</strong> state to <strong>' + state.newState + '</strong> state!');
                }
            });

            $('.select-tab').on('click', function() {
            	console.log(this.id);
                tabContainer.responsiveTabs('activate', this.id);
            });
		};
		
		
		
		
		/**
		 * Controls
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
					
					
					// Para resaltar la capa que esta cambiando
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
				var value = ui.value+1;

				var sliderData = (target.data())['lever'] || defLevelDesc;
				var dialogMsg = $('.level-description');
				dialogMsg.html("Value : "
						+ value
						+ "<br>"
						+ this.getLabelFor(sliderData.id + '-info-level-'
								+ value));

				if (!dialogMsg.is(":visible")) {
					var ctrClosed = $(".controls .closed");
					dialogMsg.show();
					dialogMsg.width(ctrClosed.width() - 10);
					dialogMsg.height(ctrClosed.height() - 10);

					dialogMsg.position({
						of : ctrClosed,
						my : 'center bottom',
						at : 'center bottom',
					});
					
					dialogMsg.css('top','auto');
					dialogMsg.css('bottom','5px');
				}

				// Play lever FX
				createjs.Sound.play('lever');
			};
			var valueFromUrl = this.getLeversValueFromUrl();
			var idxLevelTotal = 0;
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
					var currVal = (valueFromUrl[idxLevelTotal])?(valueFromUrl[idxLevelTotal]):(obj.value);
					currVal = currVal-1;
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
					idxLevelTotal++;
					fUpdateModel({target:$slider.get(0)},{value:currVal},true);
				}
				
				
				
				var $sliders = $('.twentyfive-slider-container', containerInt);
				var contW = containerInt.width();
				
				//Le queitamos el margen izquierdo de 3px
				var margin = parseInt($sliders.css('margin-left')) +parseInt( $sliders.css('margin-right'));
				contW = 100*(contW-margin*cont-1)/contW;
				var porc = (contW / cont) + '%';
				
				$sliders.css('width', porc);
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
				'class' : 'chart-content',
				'id'	: 'energy-balance-chart'
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
						ticks : ["Electricidad", 'Combustible'],
						tickRenderer : $.jqplot.CanvasAxisTickRenderer,
						tickOptions : {
							showMark : false,
							fontFamily : 'Arial, SansSerif',
							fontSize : '14pt',
							angle : 0,
							textColor : '#5d5d5d',
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

			
			
			//Las etiquetas de los ionos de energy balance 
			
			var iconsTitleTxt	= this.getLabelFor('energy-balance-pane-icon-desciption-title');
			var moreDemandTxt	= this.getLabelFor('energy-balance-pane-icon-desciption-icon-under')
			var moreSupplyTxt	= this.getLabelFor('energy-balance-pane-icon-desciption-icon-upper')
			var balancedTxt		= this.getLabelFor('energy-balance-pane-icon-desciption-icon-balanced')
			
			
			var htmlBalenceLabels = 
				'<h2>'+iconsTitleTxt+'</h2>\
				<dl>\
					<dt><span class="energy_balace_state under"></span></dt>\
					<dd>'+moreDemandTxt+'</dd>\
					<dt><span class="energy_balace_state balanced"></span></dt>\
					<dd>'+balancedTxt+'</dd>\
					<dt><span class="energy_balace_state upper"></span></dt>\
					<dd>'+moreSupplyTxt+'</dd>\
				</dl>';
			
			
			var descriptionPane = $('<div>', {'class':'energy_balance_icons_descriptions'});
			
			descriptionPane.html(htmlBalenceLabels);
			console.log("Vamos a agregar las etiquetas de energy balance",descriptionPane);
			
			chartPane.append(descriptionPane);
			
			// Para los dialogos
			$('<div>', {
				'class' : 'level-description'
			}).appendTo(container).hide();
			
			this.initBottomPane(this.element);
			this.initExtraInfo (uiControlsCfg);
		};

		
		
		/**
		 * 
		 */
		this.initBottomPane = function(parentElement){
			// To mute the bg FX
			var infoPane = $('<div>', {
				'class' : 'info-pane',
			}).appendTo(parentElement);
			
			var btnS = $('<input>', {
				'type' : 'button',
				'class' : 'sound-ctr'
			}).appendTo(infoPane);
			btnS.on('click', $.proxy(this.toggleSound, this));
			
			
			var shareWidget = stLight.htmlShare
			var path = window.location.protocol + "//" + window.location.host + "/" + window.location.pathname;
			
			shareWidget = shareWidget.replace(/\[SITE_URL\]/g,path);
			
			shareWidget = $(shareWidget);
			shareWidget.appendTo(infoPane);
			stButtons.locateElements();
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
					
					if(event.item.type != createjs.LoadQueue.IMAGE ) {
						return;
					}
					
					var img = event.item.tag;
					
					if(true || img.src.indexOf('animated') < 0){
						return;
					}
					
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
			/*var loading = $("<div>", {
				id : 'loading'
			}).appendTo(this.element);
			loading.progressbar({
				value : 1
			});*/
			var loading = $("<div>", {
				id : 'loading'
			}).appendTo($('.main_simulator'));
			loading.append('<div class="progress-label">Cargando...</div>');
			loading.progressbar({
				value : 1
				
			});

			var progressHandler = function(event, data) {
				$("#loading", $('.main_simulator')).progressbar("option", {
					value : 100 * event.progress
				});
			};

			var completeHandler = function(event) {
				// LEVERS
				this.controlsCfg = this.loader.getResult('leversConfig');
				//console.log("Configuracion palancas:",this.controlsCfg);
				var listLabels = this.loader.getResult('labelsConfig');
				if (!listLabels) {
					alert("No se encontró la configuracion de las etiquetas: \n : file : assets/configLabels.xml");
					return;
				}
				this.xmlLabels = listLabels;
				listLabels = listLabels.getElementsByTagName('label');
				this.labels = {};
				for (var i = 0; i < listLabels.length; i++) {
					var node = listLabels[i];
					this.labels[node.getAttribute('id')] = node.textContent.trim();
				}
				
				console.log("Que traducciones tenemos : ",this.labels);
				this.url_2050Model = this.controlsCfg.url_model
						|| 'getPathway.php';

				// ANIMATIOS
				var order = this.loader.getResult('animationLayerConfig');
				if(!order){
					console.log("No se cargo la configuracion de las capas");
				}
				var sprites = {};
				for (var layerID = order.length - 1; layerID > -1; layerID--) {
					var currCfg = order[layerID];
					var object = null;
				
					if (currCfg.type != 'animated' ) {
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
				//$("#loading", this.element).remove();
				$( ".progress-label" ).text("Listo!!");
				$("#loading", $('.main_simulator')).remove(); //quitamos la barra de progreso
				event.target.removeEventListener('progress', progressHandler,
						true);
				this.updateModel();
			};

			var errorHandler = function(event,a,b) {
				console.log("Error al cargar. Que tenemos : ", event.item.id,event,a,b);
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
		
		
		/**
		 * 
		 */
		this.getUrlToShare = function(){
			var path = window.location.protocol + "//" + window.location.host + "/" + window.location.pathname;
			var urlCfgLevels = '';
			for ( var ctrName in this.sliders) {
				var slider = this.sliders[ctrName];
				var value = slider.slider("option", "value");
				urlCfgLevels += value+1;
			}
			
			return path+'?l='+urlCfgLevels;
		};
		
		
		
		/**
		 * 
		 */
		this.getLeversValueFromUrl = function(){
			var params = this.getUrlVars();
			var levels = params['l'];
			
			if(levels){
				levels = levels.split('');
				for(var i = 0 ; i < levels.length; i++ ){
					levels[i] = parseInt(levels[i]);
				}
			} else {
				levels = [];
				for(var i = 0; i < 20; i++){
					levels[i] = false;
				}
			}
			
			return levels;
		};
		
		
		
		
		/**
		 *  Read a page's GET URL variables and return them as an associative array.
		 */
		this.getUrlVars = function (){
		    var vars = [], hash;
		    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
		    for(var i = 0; i < hashes.length; i++)
		    {
		        hash = hashes[i].split('=');
		        vars.push(hash[0]);
		        vars[hash[0]] = hash[1];
		    }
		    return vars;
		}
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
