document.getElementById('fileInput').addEventListener('change', handleFile);


function handleFile() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  const container = document.getElementById('cardsContainer');
  const toggle = document.getElementById('toggle');

  if (file) {
    if(container){
      container.style.display = 'none';
      toggle.style.visibility = 'hidden';
    }
    const svg = document.querySelector('svg');
    svg.innerHTML = '';

    const reader = new FileReader();

    reader.onload = function(e) {
      const fileContent = e.target.result;
      const jsonData = convertToJSON(fileContent);

      visualizarGrafico(jsonData);
    };

    reader.readAsText(file);
  } else {
    alert("Selecione um arquivo!");
  }
}

async function enviarArquivo() {
  console.log("na função enviar")
  const url = 'https://grafo-maior-clique.onrender.com/api/grafo';
  const arquivo = document.getElementById('fileInput').files[0];

  const fileInput = document.getElementById('autoresInput');
  const file = fileInput.files[0];

  const formData = new FormData();
  formData.append('file', arquivo);

  try {
    const resposta = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (resposta.ok) {
      const maiorClique = await resposta.json();
      console.log('Maior Clique:', maiorClique);
      changeNodeColor(maiorClique);

      const reader = new FileReader();

      reader.onload = function(e) {
      const fileContent = e.target.result;
      const jsonData = JSON.parse(fileContent);

      criarCardsPorIds(maiorClique,  jsonData)
    };

    reader.readAsText(file);

    

    } else {
      console.error('Erro na resposta do servidor:', resposta.status);
    }
  } catch (erro) {
    console.error('Erro ao fazer a requisição:', erro);
  }
}

function convertToJSON(text) {
  const lines = text.trim().split('\n');
  const numVertices = parseInt(lines[0]);
  const numEdges = parseInt(lines[1]);

  const nodes = Array.from({ length: numVertices }, (_, i) => ({
    name: (i).toString(),
    width: 60,
    height: 40
  }));

  const links = lines.slice(2, 2 + numEdges).map(line => {
    const [source, target] = line.split(' ').map(Number);
    return { source, target };
  });

  return { nodes, links };
}

class MapColors {
  constructor(graph, color) {
    this.colors = [];
    this.nodes = {};
    this.links = this.getLinks(graph);

    for (const node of graph.nodes) {
      console.log({ node });
      this.bindColor(node.name);
    }
  }

  bindColor(nodeName) {
    for (const currentColor of this.colors) {
      let usedColor = false;

      for (const link of this.links[nodeName]) {
        usedColor = this.nodes[link] === currentColor;

        if (usedColor) {
          break;
        }
      }

      if (!usedColor) {
        this.nodes[nodeName] = currentColor;
        return;
      }
    }

    this.colors.push("#4991df");

    this.nodes[nodeName] = this.colors[this.colors.length - 1];
  }


  getLinks(graph) {
    const links = {};

    graph.nodes.forEach((node, nodeIndex) => {
      const nodeName = node.name;

      links[nodeName] = graph.links.reduce((_links, graphLink) => {
        switch (nodeIndex) {
          case graphLink.source:
            if (!_links.includes(graph.nodes[graphLink.target].name)) {
              _links.push(graph.nodes[graphLink.target].name);
            }
            break;

          case graphLink.target:
            if (!_links.includes(graph.nodes[graphLink.source].name)) {
              _links.push(graph.nodes[graphLink.source].name);
            }
            break;
        }

        return _links;
      }, []);
    });

    return links;
  }
}

var MAP_COLORS = [];
var linksData = [];

var width = 900,
  height = 500;

var color = d3.scaleOrdinal(d3.schemeCategory20);

var cola = cola
  .d3adaptor(d3)
  .linkDistance(120)
  .avoidOverlaps(true)
  .size([width, height]);

var svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

function addColor(graph) {
  MAP_COLORS.push(color(MAP_COLORS.length++));
}

function getColor(graph) {
  MAP_COLORS.push(color(MAP_COLORS.length++));

  return color(1);
}

function visualizarGrafico(graph) {
  const mapColors = new MapColors(graph, color);

  console.log({
    graph,
    mapColors,
  });

  cola.nodes(graph.nodes).links(graph.links).start();

  class Link {
    constructor(source, target) {
      this.source = source;
      this.target = target;
      this.element = null;
    }
  }

  linksData = graph.links.map(link => new Link(link.source, link.target));

  var link = svg
    .selectAll(`.link`)
    .data(linksData)
    .enter()
    .append("line")
    .attr("class", "link")
    .style("fill", function(d) {
      return mapColors.nodes[d.name];
    })

  var node = svg
    .selectAll(`.node`)
    .data(graph.nodes)
    .enter()
    .append("rect")
    .attr("class", "node")
    .attr("width", function(d) {
      return d.width;
    })
    .attr("height", function(d) {
      return d.height;
    })
    .attr("rx", 10)
    .attr("ry", 10)
    .style("fill", function(d) {
      return mapColors.nodes[d.name];
    })
    .call(cola.drag);

  var label = svg
    .selectAll(".label")
    .data(graph.nodes)
    .enter()
    .append("text")
    .attr("class", "label")
    .text(function(d) {
      return d.name;
    })
    .call(cola.drag);

  node.append("title").text(function(d) {
    return d.name;
  });

  cola.on("tick", function() {
    link
      .attr("x1", function(d) {
        return d.source.x;
      })
      .attr("y1", function(d) {
        return d.source.y;
      })
      .attr("x2", function(d) {
        return d.target.x;
      })
      .attr("y2", function(d) {
        return d.target.y;
      });

    node
      .attr("x", function(d) {
        return d.x - d.width / 2;
      })
      .attr("y", function(d) {
        return d.y - d.height / 2;
      });

    label
      .attr("x", function(d) {
        return d.x;
      })
      .attr("y", function(d) {
        var h = this.getBBox().height;
        return d.y + h / 4;
      });
  });
}


function alterarCor(nosParaAlterar) {
  const nosString = nosParaAlterar.map(String);

  linksData.forEach(function(d) {
    if (nosString.includes(d.source.name) && nosString.includes(d.target.name)) {
      d.stroke = "#FECEEC";
    }
  });

  svg.selectAll(".link")
    .data(linksData)
    .style("stroke", function(d) {
      return d.stroke || "#DAE9F8";
    });
}


function changeNodeColor(maiorClique) {

  const nodeToUpdate = d3.selectAll(".node")
    .filter(function(d) {
      console.log(d.name)
      console.log(maiorClique.includes(parseInt(d.name)))
      return maiorClique.includes(parseInt(d.name));
    });

  console.log(nodeToUpdate)

  nodeToUpdate.style("fill", "#fa0da4");
  alterarCor(maiorClique)
}

function criarCardsPorIds(arrayDeIds, dadosAutores) {
  const container = document.getElementById('cardsContainer');

  console.log("na função cards")
  console.log(arrayDeIds)
  console.log(dadosAutores)

  // Limpar cards existentes
  container.innerHTML = '';

  // Filtrar autores com base nos IDs fornecidos
  const autoresFiltrados = dadosAutores.filter(autor => arrayDeIds.includes(autor.id));


  console.log(autoresFiltrados)
  // Criar um card para cada autor filtrado
  autoresFiltrados.forEach(autor => {

    console.log(autor)
    const card = document.createElement('div');
card.className = 'card';

const label = document.createElement('div');
label.className = 'label-cards'; // Corrigido aqui

const avatar = document.createElement('img');
avatar.src = autor.avatar;
avatar.alt = `Avatar de ${autor.nome}`;
avatar.className = 'avatar';

const nome = document.createElement('h3');
nome.innerText = autor.nome;

const id = document.createElement('span');
id.innerText = "#" + autor.id;

const area = document.createElement('p');
area.innerText = autor.areaAcademica;

// Primeiro, adiciona os elementos ao label
label.appendChild(nome);
label.appendChild(area);

// Em seguida, adiciona o avatar e o label ao card
card.appendChild(avatar);
card.appendChild(id);
card.appendChild(label);

container.appendChild(card);

    const toggle = document.getElementById('toggle');

    if (container.children.length > 0) {
      container.style.display = 'block';
      toggle.style.visibility = 'visible';
    } else {
      container.style.display = 'none';
      toggle.style.visibility = 'hidden';
    }
  });
}