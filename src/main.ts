import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'lil-gui';


const gui = new dat.GUI();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);

const renderer = new THREE.WebGLRenderer({ antialias: true });


const lineMat = new THREE.LineBasicMaterial({
	color: 0xff0000
});

const newLineGroup = new THREE.Group();
newLineGroup.name = 'newLineGroup';
scene.add(newLineGroup);
let isProportional = true;

let proportion = 0.01 / 4;
let exponentialFalloff = 0.01;
let linearFalloff = 4;

let lineCount = 200;
let isHorizontalLines = true;
let isVerticalLines = true;

gui.add({ lineCount }, 'lineCount', 2, 1000).step(1).onChange((value: number) => {
	const proportion = value / lineCount;
	lineCount = value;
	_atractorPoints.forEach((point: THREE.Vector2) => {
		point.x = point.x * proportion;
		point.y = point.y * proportion;
	})
	resetPattern();
	initPattern();
})
let pointAmount = 5;

gui.add({ pointAmount }, 'pointAmount', 1, 200).step(1).onChange((value: number) => {
	pointAmount = value;
	_atractorPoints = [];
	resetPattern();
	initPattern();
})
let _horizontalLines: THREE.Line[] = [];

gui.add({ horizontal: true }, 'horizontal').onChange((value: boolean) => {
	isHorizontalLines = value;
	if (!value) {
		_horizontalLines.forEach((line: THREE.Line) => {
			line.visible = false;
		})
	}
	else {
		_horizontalLines.forEach((line: THREE.Line) => {
			line.visible = true;
		})
		initPattern();
	}
})
let _verticalLines: THREE.Line[] = [];

gui.add({ vertical: true }, 'vertical').onChange((value: boolean) => {
	isVerticalLines = value;
	if (!value) {
		_verticalLines.forEach((line: THREE.Line) => {
			line.visible = false;
		})
	}
	else {
		_verticalLines.forEach((line: THREE.Line) => {
			line.visible = true;
		})
		initPattern();
	}
})
let _atractorPoints: THREE.Vector2[] = [];
let expFalloffGui = gui.add({ exponentialFalloff }, 'exponentialFalloff', 0, 0.3).listen().onChange((value: number) => {
	exponentialFalloff = value;
	if (isProportional) {
		linearFalloff = exponentialFalloff / proportion;
		linFalloffGui.object = { linearFalloff };
	}
	resetPattern();
	initPattern();
})
let linFalloffGui = gui.add({ linearFalloff }, 'linearFalloff', 0, 100).listen().onChange((value: number) => {
	linearFalloff = value;
	if (isProportional) {
		exponentialFalloff = linearFalloff * proportion;
		expFalloffGui.object = { exponentialFalloff };
	}
	resetPattern();
	initPattern();
})
gui.add({ isProportional }, 'isProportional').onChange((value: boolean) => {
	isProportional = value;
	if (isProportional) {
		proportion = exponentialFalloff / linearFalloff;
	}
});

const initScene = () => {

	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	camera.position.x = 100;
	camera.position.z = 500;
	camera.position.y = 100;

	const controller = new OrbitControls(camera, renderer.domElement);
	controller.target = new THREE.Vector3(100, 100, 0);
	controller.update();
}
const initPattern = () => {
	let horizontalLines: THREE.Line[] = [];
	if (_horizontalLines.length === 0 && isHorizontalLines) {
		horizontalLines = createHorizontalLines(lineCount);
		horizontalLines.forEach((line: THREE.Line) => {
			newLineGroup.add(line);
		})
		_horizontalLines = horizontalLines;
	}
	else {
		horizontalLines = _horizontalLines;
	}
	let verticalLines: THREE.Line[] = [];
	if (_verticalLines.length === 0 && isVerticalLines) {
		verticalLines = createVerticalLines(lineCount);
		verticalLines.forEach((line: THREE.Line) => {
			newLineGroup.add(line);
		})
		_verticalLines = verticalLines;
	}
	else {
		verticalLines = _verticalLines;
	}
	let atractorPoints: THREE.Vector2[] = [];
	if (_atractorPoints.length === 0) {
		atractorPoints = createAtractorpoints(pointAmount);
		_atractorPoints = atractorPoints;
	}
	else {
		atractorPoints = _atractorPoints;
	}
	updatePattern(horizontalLines, verticalLines, atractorPoints);
}
const resetPattern = () => {
	_horizontalLines.forEach((line: THREE.Line) => {
		line.geometry.dispose();
		newLineGroup.remove(line);
	})
	_horizontalLines = [];
	_verticalLines.forEach((line: THREE.Line) => {
		line.geometry.dispose();
		newLineGroup.remove(line);
	})
	_verticalLines = [];
}
const updatePattern = (horizontalLines: THREE.Line[], verticalLines: THREE.Line[], atractorPoints: THREE.Vector2[]) => {
	atractorPoints.forEach((atractorPoint: THREE.Vector2) => {
		horizontalLines.forEach((line: THREE.Object3D) => {
			const lineGeo = (line as THREE.Line).geometry as THREE.BufferGeometry;
			const linePoints = lineGeo.attributes.position.array as Float64Array;
			let newPoints = getAttractedLinePoints(linePoints, atractorPoint, 'horizontal', exponentialFalloff, linearFalloff);
			// lineGeo.dispose();
			lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(newPoints, 3));
		})
		verticalLines.forEach((line: THREE.Object3D) => {
			const lineGeo = (line as THREE.Line).geometry as THREE.BufferGeometry;
			const linePoints = lineGeo.attributes.position.array as Float64Array;
			let newPoints = getAttractedLinePoints(linePoints, atractorPoint, 'vertical', exponentialFalloff, linearFalloff);
			// lineGeo.dispose();
			lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(newPoints, 3));
		})
	});
}
const createHorizontalLines = (amount: number): THREE.Line[] => {
	const lines: THREE.Line[] = [];
	for (let i = 0; i < amount; i++) {
		const curve = new THREE.LineCurve(
			new THREE.Vector2(0, i),
			new THREE.Vector2(amount, i)
		);
		const points = curve.getPoints(pointAmount);
		const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
		const line = new THREE.Line(lineGeo, lineMat);
		lines.push(line);
	}
	return lines;
}
const createVerticalLines = (amount: number): THREE.Line[] => {
	const lines: THREE.Line[] = [];
	for (let i = 0; i < amount; i++) {
		const curve = new THREE.LineCurve(
			new THREE.Vector2(i, 0),
			new THREE.Vector2(i, amount)
		);
		const points = curve.getPoints(pointAmount);
		const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
		const line = new THREE.Line(lineGeo, lineMat);
		lines.push(line);
	}
	return lines;
}

const createAtractorpoints = (amount: number) => {

	const atractorPoints: THREE.Vector2[] = [];
	for (let i = 0; i < amount; i++) {
		const x = Math.random() * lineCount;
		const y = Math.random() * lineCount;
		atractorPoints.push(new THREE.Vector2(x, y));
	}
	return atractorPoints;
}


const getAttractedLinePoints = (linePoints: Float64Array, atractorPoint: THREE.Vector2, type: string, exponentialFalloff: number, linearFalloff: number) => {
	let newPoints: Float64Array = new Float64Array(linePoints.length)
	for (let i = 0; i < linePoints.length; i += 3) {
		const x = linePoints[i];
		const y = linePoints[i + 1];

		const deltaX = atractorPoint.x - x;
		const deltaY = atractorPoint.y - y;

		// const percentageX = (100 - Math.abs((deltaX / (countX / 2) * 100))) / 100;

		// const distance = Math.abs(deltaY); // Calculate the distance
		// const maxDistance = countY; // Define the maximum distance
		// const percentageY = customFalloff(distance, maxDistance, 0.01, 4)

		if (type === 'horizontal') {
			const percentageX = (100 - Math.abs((deltaX / (lineCount / 2) * 100))) / 100;

			const distance = Math.abs(deltaY); // Calculate the distance
			const maxDistance = lineCount; // Define the maximum distance
			const percentageY = customFalloff(distance, maxDistance, exponentialFalloff, linearFalloff)
			newPoints[i] = x;
			newPoints[i + 1] = y + (deltaY * percentageX * percentageY);
			newPoints[i + 2] = 0;
		}
		else if (type === 'vertical') {
			const percentageY = (100 - Math.abs((deltaY / (lineCount / 2) * 100))) / 100;

			const distance = Math.abs(deltaX); // Calculate the distance
			const maxDistance = lineCount; // Define the maximum distance
			const percentageX = customFalloff(distance, maxDistance, exponentialFalloff, linearFalloff)
			newPoints[i] = x + (deltaX * percentageX * percentageY);
			newPoints[i + 1] = y;
			newPoints[i + 2] = 0;
		}
		// newPoints.push(new THREE.Vector2(x, y + (deltaY * percentageX * percentageY)));
	}
	return newPoints;
}

function customFalloff(distance: number, maxDistance: number, exponentialFactor: number, linearFactor: number) {

	// Calculate the exponential component
	const exponentialPart = Math.exp(-exponentialFactor * distance);

	// Calculate the linear component
	const linearPart = 1 - (distance / maxDistance) * linearFactor;

	// Combine both components
	return exponentialPart * linearPart;
}
//add gui button for export function
function getBoundsXY(lines: THREE.Line[]): { boundsX: number, boundsY: number, minx: number, miny: number, maxx: number, maxy: number } {
	let maxx = 0;
	let minx = 0;
	let maxy = 0;
	let miny = 0;
	lines.forEach((line: THREE.Line) => {
		const lineGeo = line.geometry as THREE.BufferGeometry;
		const linePoints = lineGeo.attributes.position.array as Float64Array;
		for (let i = 0; i < linePoints.length; i += 3) {
			const x = linePoints[i];
			const y = linePoints[i + 1];
			if (x > maxx) {
				maxx = x;
			}
			if (y > maxy) {
				maxy = y;
			}
			if (x < minx) {
				minx = x;
			}
			if (y < miny) {
				miny = y;
			}
		}
	})
	const boundsX = Math.abs(maxx) + Math.abs(minx);
	const boundsY = Math.abs(maxy) + Math.abs(miny);
	return { boundsX, boundsY, minx, miny, maxx, maxy };
}
const exportLinesAsSVG = () => {
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	svg.setAttribute('viewBox', '0 0 1000 1000');

	const multiplyer = 1;
	//find highest and lowest x and y value

	let { boundsX, boundsY } = getBoundsXY([..._horizontalLines, ..._verticalLines]);
	const {minx, miny, maxx, maxy} = getBoundsXY([..._horizontalLines, ..._verticalLines]);
	

	// Calculate the width and height of your content
	const contentWidth = maxx - minx;
	const contentHeight = maxy - miny;

	// Calculate the center point of your content
	const centerX = (minx + maxx) / 2;
	const centerY = (miny + maxy) / 2;
	const margin = 100;
	// Determine the desired size of the viewBox with some margin
	const viewBoxWidth = contentWidth + margin;
	const viewBoxHeight = contentHeight + margin;

	// Calculate the top-left corner of the viewBox
	const viewBoxMinX = centerX - viewBoxWidth / 2;
	const viewBoxMinY = centerY - viewBoxHeight / 2;

	// Set the viewBox attribute of your SVG element
	svg.setAttribute('viewBox', `${viewBoxMinX} ${viewBoxMinY} ${viewBoxWidth} ${viewBoxHeight}`);
	console.log(boundsX, boundsY);
	svg.setAttribute('width', `${boundsX}`);
	svg.setAttribute('height', `${boundsY}`);
	_horizontalLines.forEach((line: THREE.Line) => {
		if (!line.visible) {
			return;
		}
		const lineGeo = line.geometry as THREE.BufferGeometry;
		const linePoints = lineGeo.attributes.position.array as Float64Array;
		const lineElement = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
		let pointsString = '';
		for (let i = 0; i < linePoints.length; i += 3) {
			const x = linePoints[i];
			const y = linePoints[i + 1];
			pointsString += `${x * multiplyer},${y * multiplyer} `;
		}
		lineElement.setAttribute('points', pointsString);
		lineElement.setAttribute('stroke', 'black');
		lineElement.setAttribute('stroke-width', '1');
		lineElement.setAttribute('fill', 'none');

		svg.appendChild(lineElement);
	})
	_verticalLines.forEach((line: THREE.Line) => {
		if (!line.visible) {
			return;
		}
		const lineGeo = line.geometry as THREE.BufferGeometry;
		const linePoints = lineGeo.attributes.position.array as Float64Array;
		const lineElement = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
		let pointsString = '';
		for (let i = 0; i < linePoints.length; i += 3) {
			const x = linePoints[i];
			const y = linePoints[i + 1];
			pointsString += `${x * multiplyer},${y * multiplyer} `;
		}
		lineElement.setAttribute('points', pointsString);
		lineElement.setAttribute('stroke', 'black');
		lineElement.setAttribute('stroke-width', '1');
		lineElement.setAttribute('fill', 'none');
		svg.appendChild(lineElement);
	})
	const svgData = new XMLSerializer().serializeToString(svg);
	const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
	const svgUrl = URL.createObjectURL(svgBlob);
	const downloadLink = document.createElement('a');
	downloadLink.href = svgUrl;
	downloadLink.download = 'pattern.svg';
	document.body.appendChild(downloadLink);
	downloadLink.click();
	document.body.removeChild(downloadLink);

}
const refresh = () => {
	_atractorPoints = [];
	resetPattern();
	initPattern();

}
gui.add({ refresh }, 'refresh');
gui.add({ exportLinesAsSVG }, 'exportLinesAsSVG');
function animate() {
	requestAnimationFrame(animate);

	renderer.render(scene, camera);
}

initScene();
initPattern();
animate();