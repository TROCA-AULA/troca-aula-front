import { render } from '@/test-utils';
import { describe, it, expect } from 'vitest';
import Logo from './Logo';

describe('Logo Component', () => {
    it('renders without crashing', () => {
        const { getByText } = render(<Logo />);
        expect(getByText('Troca')).toBeInTheDocument();
        expect(getByText('Aula')).toBeInTheDocument();
    });

    it('applies size scale', () => {
        const { container } = render(<Logo size={50} />);
        const wrapper = container.firstChild;
        expect(wrapper).toHaveStyle('transform: scale(0.5)');
    });

    it('uses default size when not provided', () => {
        const { container } = render(<Logo />);
        const wrapper = container.firstChild;
        expect(wrapper).toHaveStyle('transform: scale(1)');
    });
});
