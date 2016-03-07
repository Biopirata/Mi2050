<?php
$baseUrl = "http://localhost:9292";
$baseUrl = "http://52.26.237.126";
$operation = (array_key_exists('operation',$_POST))?$_POST['operation']:'structure';



switch ($operation){
	case 'data':
		//$code = "11111111111111111111111111111111111111111111111111111";
		$code = $_POST['code'];
		$controler = "pathways/$code";
		$code = 'data';
		break;
	default:
		$code = "structure";
		$controler = 'pathways';
}
	$url = "$baseUrl/$controler/$code";
	$output = file_get_contents($url);
echo $output;


/*
 * ghg_reduction_from_1990 => 2010 (Actualizar el codigo desde el GITHub de José Carlos)
 	Si es porcentage de reduccion, si es negativo, quiere decir que aumento  -.90 => es 190 porciento.
 	
 * Energias limpias
 	electricity->supply->
 		2050 -> indice 9 de los arreglos,
 		100*(1-(TODAS MENOS {'Convencional', 'CSS'}/'Total'))
 				
 * Balance Energético
 	
 	Combustible, es de todo 
 	Electrico es el subconjunto de electricidad


Dominios
	calculadora2050.sener.gob.mx
	mexico2050.sener.gob.mx
	
	
	
	Escala en el termometro llegar a 150% 
	
*
*/