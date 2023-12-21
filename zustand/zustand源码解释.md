我们先看下 `zustand` 的使用：

```js
import { create } from "zustand";
// 创建
const useXXX = create((set, get, api) => {
  return {
    name: "uccs",
    age: 18,
    setName: (name) => set({ name }),
    setAge: (age) => set({ age }),
  };
});

// 使用
const name = useXXX((state) => state.name);
const { setName } = useXXX();
```

`zustand` 核心就是通过 `create` 创建 `state` 和 `setState`，然后在任意地方通过 `useXXX` 获取 `state` 和 `setState`

## create

`zustand` 暴露一个 `create` 函数，这个函数接收一个函数，接收的这个函数有三个参数，`setState`、`getState`、`api`，返回一个对象 `state` 对象

`create` 函数主要做两件事情：

1. 创建 `store` 对象
   - 这个 `store` 对象传递给 `useStore` 函数跟新页面
2. 返回一个 `useBoundStore` 函数
   - 这个函数执行了之后会拿到 `state`
   ```js
   const { name } = useXXX();
   ```

```js
const create = (createState) => {
  const api = createStore(createState);
  const useBoundStore = (selector) => useStore(api, selector);
  return useBoundStore;
};
```

## createStore

`create` 函数传入的函数是 `createState`，在传递给 `createStore`，它对外提供四个 `api`

- `setState`：更新 `state`
- `getState`：获取 `state`
- `subscribe`：添加 `listener`，返回 `unsubscribe` 函数
- `destroy`：清空 `listeners`

`zustand` 中的 `state` 很简单，就一个普通变量

- `getState` 就是返回 `state` 变量
- `setState` 就是更新 `state` 变量，跟新完 `state` 之后就要调用 `listener`，这里通过遍历 `listeners`
  - `replace` 的作用是直接替换 `state`，不是合并

```js
const createStore = (createState) => {
  // state 是一个普通变量
  let state = null;
  // 更新队列
  const listeners = new Set();

  const setState = (partial, replace) => {
    const nextState = typeof partial === "function" ? partial(state) : partial;
    // 新的 state 和老的 state 不相等才更新
    if (!Object.is(nextState, state)) {
      const previousState = state;
      // replace 为 true 直接替换 state
      if (!replace) {
        state = nextState === null ? nextState : Object.assign({}, state, nextState);
      } else {
        state = nextState;
      }
      // 发布 listener，更新页面
      listeners.forEach((listener) => listener(state, previousState));
    }
  };

  const getState = () => state;

  // 用来订阅 state 的变化
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  // 销毁队列
  const destroy = () => listeners.clear();

  const api = { setState, getState, subscribe, destroy };

  // const fn = (set, get, api) => ({ name, setName: (name) => set({ name }), ... })
  // create(fn)
  // fn 就是 createState
  state = createState(setState, getState, api);

  // 把 4 个方法暴露出去
  return api;
};
```

## useStore

`create` 返回的就是 `useXXX`，每调用一次 `useXXX` 就会添加一个 `listener`，等待更新

`useStore` 接收两个参数：

- `api`：是 `createStore` 返回的四个 `api`
- `selector`：是 `useXXX` 传递的参数
  ```js
  const name = useXXX((state) => state.name);
  const setName = useXXX((state) => state.setName);
  ```

这里使用随机数来强制更新页面，这里使用随机数强制更新页面

`useXXX` 每调用一次，就会添加一个 `listener`

```js
const useStore = (api, selector) => {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const unsubscribe = api.subscribe((state, prevState) => {
      const newObj = selector ? selector(state) : state;
      const oldObj = selector ? selector(prevState) : prevState;
      if (newObj !== oldObj) {
        // 使用随机数强制更新页面
        forceUpdate(Math.random());
      }
    });
    // 销毁自己的 listener
    return unsubscribe;
  }, []);

  return selector ? selector(api.getState()) : api.getState();
};
```

`react` 原生提供了一个 `useSyncExternalStore` 函数，它接收两个参数：

- `subscribe`：订阅函数，也就是 `api.subscribe`
- `getSnapshot`：`state` 快照，也就是 `api.getState`

所以上面的 `useStore` 可以改成下面这样

```js
const useStore = (api, selector) => {
  function getState() {
    return selector ? selector(api.getState()) : api.getState();
  }
  return useSyncExternalStore(api.subscribe, getState);
};
```
