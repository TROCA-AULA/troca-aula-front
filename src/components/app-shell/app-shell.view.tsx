'use client';

import { SchoolSelector } from '@/components/SchoolSelector';
import { NotificationBell } from '@/components/NotificationBell';
import { SubstitutionCounter } from '@/components/SubstitutionCounter';
import { MENU_ID, PAINEL, TEXT } from './app-shell.constants';
import { useAppShellController } from './app-shell.controller';
import * as S from './app-shell.styles';

/**
 * Moldura de todas as telas logadas: menu lateral (montado pelo perfil) e
 * cabeçalho com escola ativa, notificações, quem está logado e "Sair".
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    sections,
    isActive,
    menuOpen,
    toggleMenu,
    closeMenu,
    logout,
    userName,
    profileLabel,
    initial,
    showCounter,
    substitution,
  } = useAppShellController();

  return (
    <S.Layout>
      <S.Overlay $open={menuOpen} onClick={closeMenu} aria-hidden="true" />
      <S.Sidebar id={MENU_ID} $open={menuOpen}>
        <S.Brand href={PAINEL.href} onClick={closeMenu}>
          <span>{TEXT.brandFirst}</span> {TEXT.brandSecond}
        </S.Brand>
        <S.Nav aria-label={TEXT.menuLabel}>
          {sections.map((section, index) => (
            <S.Section key={section.title ?? index}>
              {section.title && <S.SectionTitle>{section.title}</S.SectionTitle>}
              <S.NavList>
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <S.NavLink
                        href={item.href}
                        $active={active}
                        aria-current={active ? 'page' : undefined}
                        onClick={closeMenu}
                      >
                        {item.label}
                      </S.NavLink>
                    </li>
                  );
                })}
              </S.NavList>
            </S.Section>
          ))}
        </S.Nav>
      </S.Sidebar>

      <S.Column>
        <S.Header>
          <S.MenuButton
            type="button"
            onClick={toggleMenu}
            aria-label={menuOpen ? TEXT.closeMenu : TEXT.openMenu}
            aria-expanded={menuOpen}
            aria-controls={MENU_ID}
          >
            ☰
          </S.MenuButton>
          <SchoolSelector />
          <S.Spacer />
          {showCounter && (
            <S.CounterSlot>
              <SubstitutionCounter
                current={substitution.current}
                limit={substitution.limit}
                percentage={substitution.percentage}
                loading={substitution.loading}
              />
            </S.CounterSlot>
          )}
          <S.HeaderEnd>
            <NotificationBell />
            <S.UserInfo>
              <S.UserText>
                <S.UserName>{userName}</S.UserName>
                <S.UserRole>{profileLabel}</S.UserRole>
              </S.UserText>
              <S.Avatar aria-hidden="true">{initial}</S.Avatar>
            </S.UserInfo>
            <S.LogoutButton type="button" onClick={logout}>
              {TEXT.logout}
            </S.LogoutButton>
          </S.HeaderEnd>
        </S.Header>
        <S.Main>{children}</S.Main>
      </S.Column>
    </S.Layout>
  );
}
