import create from 'zustand';

interface State {
  searchString: string;
  setSearchString: (searchString: string) => void;
}

export const useStore = create<State>((set) => ({
  searchString: '',
  setSearchString: (searchString: string) => set({ searchString }),
}));
