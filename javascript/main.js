$(function() {
	if (!String.prototype.trim) {
		String.prototype.trim = function() {
			return this.replace(/^\s+|\s+$/g, '');
		};
	}
	var simulator = new twentyfiveMX.AnimatedSimulator($('.main_simulator'));
	


	/**
		TO OVERWRIDE
	*/
	simulator.onAssetsLoadComplete = function ( event ){
		console.log("**************************** TERMINADOMOS A ANIMAR");
		this.initDisplayAnimations();
	}
	



	/**
	*/
	simulator.onAssetsLoadProgress = function(event){
		var value = 100 * event.progress;
		console.log("Vamos leyendo "+value+"%");
	};

	simulator.init();
	window.simulator = simulator; 
});