import Link from 'next/link';
import styled, { css } from 'styled-components';
import { MOBILE_BREAKPOINT } from './app-shell.constants';

const mobile = `@media (max-width: ${MOBILE_BREAKPOINT})`;

export const Layout = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
`;

export const Sidebar = styled.aside<{ $open: boolean }>`
  flex-shrink: 0;
  width: 248px;
  height: 100vh;
  position: sticky;
  top: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 12px;
  background: ${({ theme }) => theme.colors.sidebar};
  color: ${({ theme }) => theme.colors.onPrimary};

  ${mobile} {
    position: fixed;
    left: 0;
    z-index: 1001;
    transition: transform 0.2s ease;
    transform: translateX(${({ $open }) => ($open ? '0' : '-100%')});
    box-shadow: ${({ $open, theme }) => ($open ? theme.shadow.modal : 'none')};
  }
`;

export const Overlay = styled.div<{ $open: boolean }>`
  display: none;

  ${mobile} {
    ${({ $open }) =>
      $open &&
      css`
        display: block;
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: ${({ theme }) => theme.colors.overlay};
      `}
  }
`;

export const Brand = styled(Link)`
  padding: 4px 12px 8px;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.onPrimary};

  span {
    color: ${({ theme }) => theme.colors.sidebarSection};
  }
`;

export const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const SectionTitle = styled.p`
  padding: 0 12px 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.sidebarSection};
`;

export const NavList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const NavLink = styled(Link)<{ $active: boolean }>`
  display: block;
  padding: 9px 12px;
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: 14px;
  font-weight: 500;
  color: ${({ $active, theme }) => ($active ? theme.colors.onPrimary : theme.colors.sidebarText)};
  background: ${({ $active, theme }) => ($active ? theme.colors.sidebarActive : 'transparent')};
  /* Barrinha verde-água marca a tela atual. */
  box-shadow: ${({ $active, theme }) =>
    $active ? `inset 3px 0 0 ${theme.colors.sidebarSection}` : 'none'};
  transition: background-color 0.15s ease, color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.sidebarHover};
    color: ${({ theme }) => theme.colors.onPrimary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.sidebarSection};
    outline-offset: 2px;
  }
`;

export const Column = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

export const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 10;
  min-height: 64px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  padding: 10px 24px;
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

  ${mobile} {
    padding: 10px 16px;
  }
`;

export const MenuButton = styled.button`
  display: none;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: transparent;
  font-size: 20px;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;

  ${mobile} {
    display: inline-flex;
  }
`;

/** Empurra o contador e o bloco do usuário para a direita. */
export const Spacer = styled.div`
  flex: 1;
`;

/** No celular o contador desce para uma linha própria. */
export const CounterSlot = styled.div`
  ${mobile} {
    order: 10;
    flex-basis: 100%;
  }
`;

export const HeaderEnd = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  ${mobile} {
    gap: 10px;
  }
`;

export const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const UserText = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.2;

  ${mobile} {
    display: none;
  }
`;

export const UserName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

export const UserRole = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.onPrimary};
  background: ${({ theme }) => theme.colors.primary};
`;

export const LogoutButton = styled.button`
  padding: 8px 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: transparent;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.danger};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.dangerBg};
  }
`;

export const Main = styled.main`
  flex: 1;
  min-width: 0;
`;
