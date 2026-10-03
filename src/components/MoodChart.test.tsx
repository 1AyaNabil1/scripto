import { fireEvent, render, screen, within } from '@testing-library/react';
import { loadDemo } from '../demo/samples';
import { moodCounts, peakIndex } from '../lib/arc';
import { MoodChart } from './MoodChart';

describe('mood summary helpers', () => {
  it('counts moods in order of first appearance', () => {
    expect(moodCounts([{ mood: 'tense' }, { mood: 'calm' }, { mood: 'tense' }])).toEqual([
      { mood: 'tense', count: 2 },
      { mood: 'calm', count: 1 },
    ]);
  });

  it('finds the first peak', () => {
    expect(peakIndex([{ intensity: 2 }, { intensity: 5 }, { intensity: 5 }])).toBe(1);
    expect(peakIndex([])).toBe(-1);
  });
});

describe('MoodChart', () => {
  const scenes = loadDemo('clockmaker')!.scenes;

  it('describes the arc for screen readers and labels every column', () => {
    render(<MoodChart scenes={scenes} rtl={false} lang="en" />);
    const plot = screen.getByRole('list', { name: /emotional arc across 6 scenes/i });
    expect(plot).toHaveAccessibleName(/intensity runs 1, 2, 3, 4, 5, 4 out of 5, peaking at scene 5/i);
    const columns = within(plot).getAllByRole('listitem');
    expect(columns).toHaveLength(6);
    expect(columns[3]).toHaveAccessibleName('Scene 4, The watch he loved: intensity 4 of 5, dramatic');
  });

  it('shows a tooltip on focus and hides it on blur', () => {
    render(<MoodChart scenes={scenes} rtl={false} lang="en" />);
    const column = screen.getAllByRole('listitem', { name: /^scene/i })[1]!;
    fireEvent.focus(column);
    expect(column).toHaveTextContent('2/5');
    expect(column).toHaveTextContent('A silent music box');
    fireEvent.blur(column);
    expect(column).not.toHaveTextContent('2/5');
  });

  it('lists the mood mix and offers a table view', () => {
    render(<MoodChart scenes={scenes} rtl={false} lang="en" />);
    expect(screen.getByRole('heading', { name: 'Moods' })).toBeInTheDocument();
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(7);
    expect(within(table).getByText('Extreme close-up')).toBeInTheDocument();
  });

  it('lays the arc out right to left for RTL storyboards', () => {
    const { container } = render(<MoodChart scenes={loadDemo('bottle')!.scenes} rtl lang="ar" />);
    expect(container.querySelector('.arc')).toHaveAttribute('dir', 'rtl');
  });
});
