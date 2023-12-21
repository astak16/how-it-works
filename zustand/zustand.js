import { useEffect, useState, useSyncExternalStore } from "react";

const createStore = (createState) => {
  let state = null;
  const listeners = new Set();

  const setState = (partial, replace) => {
    const nextState = typeof partial === "function" ? partial(state) : partial;
    if (!Object.is(nextState, state)) {
      const previousState = state;
      if (!replace) {
        state = nextState === null ? nextState : Object.assign({}, state, nextState);
      } else {
        state = nextState;
      }
      listeners.forEach((listener) => listener(state, previousState));
    }
  };

  const getState = () => state;

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const destroy = () => {
    listeners.clear();
  };

  const api = { setState, getState, subscribe, destroy };

  state = createState(setState, getState, api);

  return api;
};

const useStore = (api, selector) => {
  // 使用 useEffect
  // const [, forceUpdate] = useState(0);
  // useEffect(() => {
  //   const unsubscribe = api.subscribe((state, prevState) => {
  //     const newObj = selector ? selector(state) : state;
  //     const oldObj = selector ? selector(prevState) : prevState;
  //     if (newObj !== oldObj) {
  //       forceUpdate(Math.random());
  //     }
  //   });
  //   return unsubscribe;
  // }, []);

  // return selector ? selector(api.getState()) : api.getState();

  // 使用 useSyncExternalStore
  function getState() {
    return selector ? selector(api.getState()) : api.getState();
  }
  return useSyncExternalStore(api.subscribe, getState);
};

export const create = (createState) => {
  const api = createStore(createState);
  const useBoundStore = (selector) => useStore(api, selector);
  return useBoundStore;
};
