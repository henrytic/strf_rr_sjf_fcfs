class Proceso {
    constructor(nombre, tiempoLlegada, duracion) {
      this.nombre = nombre;
      this.tiempoLlegada = tiempoLlegada;
      this.duracionOriginal = duracion; // Duración original del proceso
      this.duracion = duracion;         // Duración que irá disminuyendo
      this.segmentos = [];              // Segmentos de ejecución para el diagrama de Gantt
    }
  }
  
  let procesos = [];
  
  document.getElementById('formProceso').addEventListener('submit', function(event) {
    event.preventDefault();
  
    let nombre = document.getElementById('proceso').value;
    let tiempoLlegada = parseInt(document.getElementById('tiempoLlegada').value, 10);
    let duracion = parseInt(document.getElementById('duracion').value, 10);
  
    procesos.push(new Proceso(nombre, tiempoLlegada, duracion));
    document.getElementById('formProceso').reset();
  });
  
  function calcularSRTF(procesos) {
    let tiempo = 0;
    let finalizados = 0;
    let procesoAnterior = null;
  
    // Inicializar segmentos para todos los procesos
    procesos.forEach(proceso => {
      proceso.segmentos = [];
      proceso.duracion = proceso.duracionOriginal;
    });
  
    while (finalizados < procesos.length) {
      let procesoActual = null;
      let tiempoRestanteMinimo = Number.MAX_SAFE_INTEGER;
  
      for (let i = 0; i < procesos.length; i++) {
        if (procesos[i].tiempoLlegada <= tiempo && procesos[i].duracion < tiempoRestanteMinimo && procesos[i].duracion > 0) {
          tiempoRestanteMinimo = procesos[i].duracion;
          procesoActual = procesos[i];
        }
      }
  
      if (procesoActual) {
        procesoActual.duracion--;
  
        // Registro de los segmentos de ejecución para el diagrama de Gantt
        if (!procesoActual.segmentos.length || procesoActual !== procesoAnterior) {
          procesoActual.segmentos.push({ inicio: tiempo, duracion: 1 });
        } else {
          procesoActual.segmentos[procesoActual.segmentos.length - 1].duracion++;
        }
  
        if (procesoActual.duracion === 0) {
          finalizados++;
        }
  
        procesoAnterior = procesoActual;
      }
  
      tiempo++;
    }
  
    // Calcular tiempos de retorno y espera
    return procesos.map(p => {
      let tiempoTotal = p.segmentos.reduce((acc, seg) => acc + seg.duracion, 0);
      let tiempoFinal = p.segmentos[p.segmentos.length - 1].inicio + p.segmentos[p.segmentos.length - 1].duracion;
      let tiempoRetorno = tiempoFinal - p.tiempoLlegada;
      let tiempoEspera = tiempoRetorno - p.duracionOriginal;
  
      return {
        nombre: p.nombre,
        tiempoRetorno,
        tiempoEspera,
        segmentos: p.segmentos // Para el diagrama de Gantt
      };
    });
  }
  
  
  function calcularResultados() {
    let resultados = calcularSRTF(procesos);
    let tbody = document.getElementById('tablaResultados').getElementsByTagName('tbody')[0];
    tbody.innerHTML = ''; // Limpiar tabla existente
  
    resultados.forEach(resultado => {
      let fila = tbody.insertRow();
      fila.insertCell(0).innerHTML = resultado.nombre;
      fila.insertCell(1).innerHTML = resultado.tiempoRetorno;
      fila.insertCell(2).innerHTML = resultado.tiempoEspera;
    });
  
    drawChart();
    // Aquí podrías agregar la lógica para dibujar el diagrama de Gantt usando resultado.segmentos
  }
  
  google.charts.load('current', {'packages':['gantt']});
  google.charts.setOnLoadCallback(drawChart);
  
  function drawChart() {
    let data = new google.visualization.DataTable();
    data.addColumn('string', 'Task ID');
    data.addColumn('string', 'Task Name');
    data.addColumn('date', 'Start Date');
    data.addColumn('date', 'End Date');
    data.addColumn('number', 'Duration');
    data.addColumn('number', 'Percent Complete');
    data.addColumn('string', 'Dependencies');
  
    let resultados = calcularSRTF(procesos);
    resultados.forEach(resultado => {
      resultado.segmentos.forEach((segmento, index) => {
        let inicio = new Date(0, 0, 0, 0, segmento.inicio);
        let fin = new Date(0, 0, 0, 0, segmento.inicio + segmento.duracion);
        data.addRow([`${resultado.nombre}-${index}`, resultado.nombre, inicio, fin, null, 100, null]);
      });
    });
  
    let options = {
      height: 400,
      gantt: {
        trackHeight: 30
      }
    };
  
    let chart = new google.visualization.Gantt(document.getElementById('chart_div'));
    chart.draw(data, options);
  }