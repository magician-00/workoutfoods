import {createContext, useState, useContext} from 'react';

export interface MenuContextType {
  isMenuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
}

export const MenuContext = createContext<MenuContextType>({
  isMenuOpen: false,
  openMenu: () => {},
  closeMenu: () => {},
});

export const MenuContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const openMenu = () => setIsMenuOpen(true);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <MenuContext.Provider value={{isMenuOpen, openMenu, closeMenu}}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenuContext = () => useContext(MenuContext);
