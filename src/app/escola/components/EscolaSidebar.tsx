'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styled from 'styled-components';

const SidebarContainer = styled.aside`
  width: 250px;
  background-color: #1e3a5f;
  color: white;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
`;

const Logo = styled.h1`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 32px;
  padding: 0 8px;
  color: #fff;
`;

const NavList = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const NavItem = styled(Link)<{ $active: boolean }>`
  padding: 12px 16px;
  border-radius: 8px;
  text-decoration: none;
  color: ${({ $active }) => ($active ? '#fff' : 'rgba(255, 255, 255, 0.7)')};
  background-color: ${({ $active }) => ($active ? 'rgba(255, 255, 255, 0.15)' : 'transparent')};
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  &:focus {
    outline: 2px solid #4a90d9;
    outline-offset: 2px;
  }
`;

const navItems = [
  { label: 'Painel', href: '/dashboard' },
  { label: 'Jornada Docente', href: '/escola/jornada-docente' },
  { label: 'Fechamento de Ponto', href: '/escola/fechamento-ponto' },
];

export function EscolaSidebar() {
  const pathname = usePathname();

  return (
    <SidebarContainer>
      <Logo>Gestão Escolar</Logo>
      <NavList>
        {navItems.map((item) => (
          <NavItem key={item.href} href={item.href} $active={pathname === item.href}>
            {item.label}
          </NavItem>
        ))}
      </NavList>
    </SidebarContainer>
  );
}
