/** @jsx h */

/**
 * 以 root 为根节点的 vdom 为模板，构建 dom 树
 * 返回新构建的 dom 树根节点
 */
function buildDOMTree(root) {
  if (isTextNode(root)) {
    return document.createTextNode(root);
  }
  const $root = document.createElement(root.type);
  root.children
    .map(buildDOMTree)
    .forEach(($child) => $root.appendChild($child));
  return $root;
}

function isNodeChanged(newNode, oldNode) {
  return (
    // 类型变化，文本节点变元素节点，或者反之
    typeof newNode !== typeof oldNode ||
    // 文本节点值变化
    (isTextNode(newNode) && !Object.is(newNode, oldNode)) ||
    // 元素类型变化
    newNode.type !== oldNode.type
  );
}

function notEmptyNode(node) {
  return node !== undefined && node !== null;
}

function isTextNode(node) {
  return notEmptyNode(node) && typeof node !== "object";
}

/**
 * 对比新旧 vdom 树（diff），同步更新 dom 树
 */
function diffUpdateDOMTree($parent, newNode, oldNode, index = 0) {
  if (!$parent) {
    return;
  }
  const $currentNode = $parent.childNodes[index];
  if (!notEmptyNode(oldNode) && notEmptyNode(newNode)) {
    // 新增节点
    $parent.appendChild(buildDOMTree(newNode));
  } else if (notEmptyNode(oldNode) && !notEmptyNode(newNode)) {
    // 删除节点
    $parent.removeChild($currentNode);
  } else if (isNodeChanged(newNode, oldNode)) {
    // 替换节点
    $parent.replaceChild(buildDOMTree(newNode), $currentNode);
  } else if (!isTextNode(newNode)) {
    // 向下递归，更新子节点
    const maxChildLen = Math.max(
      newNode.children.length,
      oldNode.children.length
    );
    for (let i = 0; i < maxChildLen; i++) {
      diffUpdateDOMTree(
        $currentNode,
        newNode.children[i],
        oldNode.children[i],
        i
      );
    }
  }
}

/**
 * 构建 vdom 树
 */
function h(type, props, ...children) {
  props = props || {};
  children = children.filter(notEmptyNode);
  return { type, props, children };
}

/**
 * render
 * 初始化时将 vdom 树构建成 dom 树后插入 dom 树根节点
 * 若已初始化，则对比新旧 vdom 树更新 dom 树
 */
let currentRoot; // 当前 vdom 树根节点
let $container; // dom 容器根节点

function render(root, $root) {
  if (currentRoot && $container) {
    diffUpdateDOMTree($root, root, currentRoot);
  } else {
    $root.appendChild(buildDOMTree(root));
    $container = $root;
  }
  // diff 完成后，设置新 vdom 树为当前 vdom 树，以用作下一次 diff 的旧 vdom 树
  currentRoot = root;
}

/// App

function App(count) {
  return (
    <p>
      <h1>{count}</h1>
      {count % 2 !== 0 ? <p>it's an odd number!</p> : null}
      <span>this is a span</span>
    </p>
  );
}

const $main = document.getElementById("main");
let i = 0;

setInterval(() => {
  render(App(i++), $main);
}, 1000);
