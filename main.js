const windowWidth = $(window).width();
const windowHeight = $(window).height();

$(window).resize(function() {
    if (
        windowWidth != $(window).width() ||
        windowHeight != $(window).height()
    ) {
        location.reload();
        return;
    }
});
let width = windowWidth;
let height = windowHeight;

let dimension = Math.min(width,height)

let tooltip = floatingTooltip('gates_tooltip', 240, 10);

let strokeWidthScale = d3.scaleLinear().domain(d3.extent(links,d=>d.weight)).range([0.2,25]);
let strokeOpacityScale = d3.scaleLinear().domain(d3.extent(links,d=>d.weight)).range([0.7,1]);

let nodeScale = d3.scaleLinear().domain(d3.extent(nodes,d=>d.OutDeg)).range([5,40]);

const leidenCats = Array.from({ length: 7 }, (_, i) => i + 1);

let colorScale = d3.scaleOrdinal().domain(leidenCats).range(["#4269d0", "#efb118", "#ff725c", "#6cc5b0", "#5ca75b","#ef90b6","#9b66ea"]);
let xScale = d3.scaleLinear().domain(d3.extent(nodes,d=>d.x)).range([0,width]);
let yScale = d3.scaleLinear().domain(d3.extent(nodes,d=>d.y)).range([0,height]);


const drag = simulation => {

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}

const simulation = d3.forceSimulation(nodes)
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX(d=>d.x))
    .force("y", d3.forceY(d=>d.y))
    // .force("x", d3.forceX(d=>xScale(d.x)))
    // .force("y", d3.forceY(d=>yScale(d.y)))
    .force("link", d3.forceLink(links).id(d => d.ID))
    .force("charge", d3.forceManyBody().strength(-1000).theta(0.1))



const svg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("font-size", "13")
    .append("g")
    // .attr("transform",`translate(-100,0)`)



const link = svg.append("g")
    .attr("fill", "none")
    .selectAll("path")
    .data(links)
    .join("path")
    .attr("id",d=>`id_${d.ID}`)
    .attr("class","links")
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")
    .attr("stroke",d=> {
        let source = nodes.filter(node=>{
            return node.ID===d.source.ID
        });

        let target = nodes.filter(node=>{
            return node.ID===d.target.ID
        });

        const sourceColor = colorScale(source[0].Leiden);
        const targetColor = colorScale(target[0].Leiden);
        const gradientID = "gradient-" + d.source.ID + "-" + d.target.ID;
        const gradient = svg.append("linearGradient")
            .attr("id", gradientID)
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", d.source.x)
            .attr("y1", d.source.y)
            .attr("x2", d.target.x)
            .attr("y2", d.target.y);
        // Add gradient stops
        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", targetColor);
        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", sourceColor);
        // return "url(#" + gradientID + ")";
           return colorScale(target[0].Leiden)
    })

    .attr("stroke-width", d=>strokeWidthScale(d.weight))
    .style("opacity", d=> strokeOpacityScale(d.weight))


// link.source = node.key then get the node.attributes.color

const node = svg.append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("fill", d => colorScale(d.Leiden))
    .attr("stroke","black")
    .attr("stroke-width",0.5)
    .call(drag(simulation));


node.append("circle")
    .attr("class","circles")
    .attr("id",d=>`id_${d.ID.substring(1)}`)
    .attr("r", d=>nodeScale(d.OutDeg))
    .on("mouseover",(e,d)=>{
        let linksToHighlight = links.filter(link=>link.source.ID === d.ID);
        //only highlight the ones where the source is the key, not where the target is the key, so got rid of "|| link.target.key === d.key"
        let source = d.ID.substring(1);
        d3.selectAll(".links").style("opacity",0);
        d3.selectAll(".circles").style("opacity",0);
        d3.selectAll(".texts").style("opacity",0);
        d3.selectAll(".texts_handle").style("opacity",0);
        d3.select(`#id_${source}`).style("opacity",1);
        d3.select(`#id_text_${source}`).style("opacity",1);
        d3.select(`#id_text2_${source}`).style("opacity",1);
        d3.select(`#id_texthandle_${source}`).style("opacity",1);
        d3.select(`#id_texthandle2_${source}`).style("opacity",1);
        linksToHighlight.forEach((link) =>{
            let target = link.target.ID.substring(1);
            d3.select(`#id_${target}`).style("opacity",1);
            d3.select(`#id_text_${target}`).style("opacity",1);
            d3.select(`#id_text2_${target}`).style("opacity",1);
            d3.select(`#id_texthandle_${target}`).style("opacity",1);
            d3.select(`#id_texthandle2_${target}`).style("opacity",1);
            d3.select(`#id_${link.ID}`).style("opacity",strokeOpacityScale(link.weight));
        })
    })
    .on("mouseout",(e,d)=>{
        links.forEach((link) =>{
            d3.select(`#id_${link.ID}`).style("opacity",strokeOpacityScale(link.weight));
        })
        d3.selectAll(".circles").style("opacity",1);
        d3.selectAll(".texts").style("opacity",1);
        d3.selectAll(".texts_handle").style("opacity",1);
    })




node.append("text")
    .attr("class","texts")
    .attr("id",d=>`id_text_${d.ID.substring(1)}`)
    .attr("x", 8)
    .attr("y", "1em")
    .attr("fill", "black")
    .text(d => d.EngName)
    .clone(true).lower()
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 3)
    .attr("id",d=>`id_text2_${d.ID.substring(1)}`)


node.append("text")
    .attr("class","texts_handle")
    .attr("id",d=>`id_texthandle_${d.ID.substring(1)}`)
    .attr("x", 8)
    .attr("y", "2.2em")
    .attr("fill", "black")
    .style("font-weight", 400)
    .style("font-size", 11)
    .text(d => d.ID)
    .clone(true).lower()
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 3)
    .attr("id",d=>`id_texthandle2_${d.ID.substring(1)}`)



simulation.on("tick", () => {
    link.attr("d", linkArc);
    node.attr("transform", d => `translate(${d.x},${d.y})`); 
})

function linkArc(d) {
    const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
    return `
      M${d.source.x},${d.source.y}
      A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
    `;
}

