# Demo sandbox

Open <https://photo-stack-proof.sociobot.in/demo> or use **Try it with sample
data** on the landing page.

The demo immediately analyzes six local sample sidecars. It includes one
verified pair with the same Content Identifier, one conflict with different
identifiers, and one ambiguous pair with matching timestamps only.

The persistent banner says **Demo — sample data, nothing is saved to your real
report**. **Reset demo** clears and restores the sample. **Start for real**
discards the demo database before opening the normal app.

Demo storage uses the separate IndexedDB database `photo-stack-proof-demo`.
Normal reports and paid snapshots use `photo-stack-proof`. Demo mode does not
read or write the normal report database or the license keys in localStorage.
