//@ts-ignore
import { parse, stringify, scale } from "svg-path-tools";
//@ts-ignore
import toPath from "element-to-path";

// Based on https://github.com/elrumordelaluz/scale-that-svg/blob/master/index.js

function scaleAttr(node: Element, name: string, scale: number) {
  const value = node.getAttribute(name);
  if (value) {
    const number = value.match(/(\d+)/)?.[1];
    if (number) {
      node.setAttribute(name, value.replace(number, +number * scale + ""));
    }
  }
}

export function scaleElement(node: Element, scaleOptions: { scale: number }) {
  const { scale: s } = scaleOptions;

  if (node.tagName === "svg") {
    const viewBox = node.getAttribute("viewBox");
    if (viewBox) {
      node.setAttribute(
        "viewBox",
        viewBox
          .split(" ")
          .map((v, i) => (i > 1 ? +v * s : v))
          .join(" ")
      );

      scaleAttr(node, "width", s);
      scaleAttr(node, "height", s);
    }
  }

  if (/(rect|circle|ellipse|polygon|polyline|line|path)/.test(node.tagName)) {
    const attrs = Array.from(node.attributes).map(attr => [
      attr.name,
      attr.value,
    ]);
    const path = toPath({
      name: node.tagName,
      attributes: Object.fromEntries(attrs),
    });
    const d = stringify(scale(parse(path), { scale: s, round: 4 }));

    const newPath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    newPath.setAttribute("d", d);

    for (const [name, value] of attrs) {
      if (name === "stroke-width" || name === "strokeWidth") {
        newPath.setAttribute(name, +value * s + "");
      }
      if (/fill|stroke|opacity/.test(name)) {
        newPath.setAttribute(name, value);
      }
    }

    const parentNode = node.parentNode!;
    parentNode.insertBefore(newPath, node);
    parentNode.removeChild(node);
  }

  const children: Element[] = [];
  let child: Element | null = node.firstElementChild;
  while (child) {
    children.push(child);
    child = child.nextElementSibling;
  }

  for (const child of children) {
    scaleElement(child, scaleOptions);
  }
}
