import { useCallback, useEffect, useState } from "react";

import type { ItemType } from "../game/items";

const STORAGE_KEY = "appintoss.puzzle.inventory";

type Inventory = Record<ItemType, number>;

const DEFAULT_INVENTORY: Inventory = {
  timeBoost: 0,
  mismatchShield: 0,
  doubleReward: 0,
};

function loadInventory(): Inventory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_INVENTORY;

    const parsed = JSON.parse(raw);
    const result = { ...DEFAULT_INVENTORY };
    for (const key of Object.keys(DEFAULT_INVENTORY) as ItemType[]) {
      if (Number.isInteger(parsed?.[key]) && parsed[key] >= 0) {
        result[key] = parsed[key];
      }
    }
    return result;
  } catch (error) {
    console.error("인벤토리 불러오기 실패:", error);
    return DEFAULT_INVENTORY;
  }
}

interface UseInventoryReturn {
  items: Inventory;
  addItem: (type: ItemType) => void;
  consumeItem: (type: ItemType) => boolean;
}

export function useInventory(): UseInventoryReturn {
  const [items, setItems] = useState<Inventory>(loadInventory);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("인벤토리 저장 실패:", error);
    }
  }, [items]);

  const addItem = useCallback((type: ItemType) => {
    setItems((prev) => ({ ...prev, [type]: prev[type] + 1 }));
  }, []);

  const consumeItem = useCallback(
    (type: ItemType): boolean => {
      if (items[type] <= 0) return false;
      setItems((prev) => ({ ...prev, [type]: prev[type] - 1 }));
      return true;
    },
    [items],
  );

  return { items, addItem, consumeItem };
}
