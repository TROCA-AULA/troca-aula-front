'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSchoolContext } from '@/contexts/SchoolContext';
import { PROFILE, PROFILE_LABELS } from '@/constants/profile';
import { useSubstitutionLimit } from '@/hooks/useSubstitutionLimit';
import { buildMenu, initialOf, isActiveRoute } from './app-shell.utils';

export function useAppShellController() {
  const pathname = usePathname() ?? '';
  const { user, schoolLinks, logout } = useSchoolContext();
  const [menuOpen, setMenuOpen] = useState(false);

  const isProfessor = user?.profileId === PROFILE.PROFESSOR;
  const substitution = useSubstitutionLimit(isProfessor ? user?.id : undefined);

  const sections = useMemo(() => buildMenu(user, schoolLinks), [user, schoolLinks]);
  const isActive = useCallback((href: string) => isActiveRoute(pathname, href), [pathname]);
  const toggleMenu = useCallback(() => setMenuOpen((open) => !open), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return {
    sections,
    isActive,
    menuOpen,
    toggleMenu,
    closeMenu,
    logout,
    userName: user?.name ?? '',
    profileLabel: user?.profileId != null ? PROFILE_LABELS[user.profileId] ?? '' : '',
    initial: initialOf(user?.name),
    // O contador só faz sentido para professor com escola (contrato).
    showCounter: isProfessor && !!user?.schoolId,
    substitution,
  };
}
