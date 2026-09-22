import { useEffect, useState } from "react";
import {
  ACTING_STORAGE_KEY,
  DEFAULT_ACTING_ROLE,
  isRmfRoleId,
  roleById,
  type RmfRole,
  type RmfRoleId,
} from "@/lib/grc/phase0";

export function useActingRole() {
  const [roleId, setRoleIdState] = useState<RmfRoleId>(DEFAULT_ACTING_ROLE);

  useEffect(() => {
    const stored = window.localStorage.getItem(ACTING_STORAGE_KEY);
    if (stored && isRmfRoleId(stored)) setRoleIdState(stored);
  }, []);

  function setRoleId(id: RmfRoleId) {
    setRoleIdState(id);
    window.localStorage.setItem(ACTING_STORAGE_KEY, id);
  }

  const role: RmfRole = roleById(roleId) ?? roleById(DEFAULT_ACTING_ROLE)!;
  return { roleId, setRoleId, role };
}
