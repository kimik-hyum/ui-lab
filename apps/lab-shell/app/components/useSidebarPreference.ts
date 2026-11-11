"use client";

import { useSyncExternalStore } from "react";

const storageKey = "ui-lab:sidebar-collapsed";
const changeEvent = "ui-lab:sidebar-preference-change";
let currentPreference: boolean | undefined;

function getSnapshot(): boolean | null {
  if (currentPreference !== undefined) return currentPreference;
  try {
    const saved = window.localStorage.getItem(storageKey);
    return saved === "true" ? true : saved === "false" ? false : null;
  } catch {
    return null;
  }
}

const getServerSnapshot = () => null;

function subscribe(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key !== storageKey && event.key !== null) return;
    currentPreference = undefined;
    onChange();
  }
  window.addEventListener(changeEvent, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(changeEvent, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function setPreference(collapsed: boolean) {
  currentPreference = collapsed;
  try {
    window.localStorage.setItem(storageKey, String(collapsed));
  } catch {
    // The current document still remembers the choice when storage is unavailable.
  }
  window.dispatchEvent(new Event(changeEvent));
}

export function useSidebarPreference() {
  const preference = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [preference, setPreference] as const;
}
