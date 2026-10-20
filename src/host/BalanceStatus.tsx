import { useComped, useCreditBalance } from '@zibby-run/app-kit/react';

/** The Zibby header pill: the visitor's credit balance, or "Comped" when their runs are on Zibby. */
export function BalanceStatus() {
  const comped = useComped();
  const balance = useCreditBalance();
  return (
    <span className="pill status-pill is-on" title={comped ? 'Your runs are on Zibby' : 'Your Zibby credits'}>
      {comped ? 'Comped' : balance === null ? '—' : `${balance.toLocaleString('en-US')} cr`}
    </span>
  );
}
