# Architecture and roadmap

## Milestone 0: repeatable local execution (this package)

```
Safari / iPhone Home Screen PWA
       |
       +-- mobile input controls / host command history
       |
       +-- same-origin iframe (Bellard's 2019 JSLinux frontend)
                 |
             TinyEMU WebAssembly CPU + VirtIO
                 |
              RISC-V 64 Linux / BusyBox
                 |
             read-only published image + ephemeral guest writes
```

The public archive includes precompiled JS/WASM, small kernels and split block
image files. The GitHub Actions job downloads it, without relying on the live
JSLinux website at runtime. The app has no default guest networking or login.

## Milestone 1: writable persistent Linux root

**This is the make-or-break feature**. Bellard's original JavaScript block
backend needs a browser-backed write overlay or a different host filesystem.
Choose one implementation after tests:

1. IndexedDB/OPFS-backed sparse write overlay for VirtIO block storage; persist
   changed blocks, flush/sync reliably and snapshot/export the overlay.
2. Or an actual local 9P shared filesystem mounted writable. Validate Unix
   permissions, symlinks, rename, atomic writes, mmap, crash recovery, and apk.

Start with test: create file, shutdown, relaunch, read it unchanged. Extend test
to thousands of files, interrupted writes and package installs. The shell history
in localStorage is NOT guest persistence.

## Milestone 2: modern Linux distribution

Build a current Alpine riscv64 filesystem and compatible kernel or a smaller
Buildroot target. A current minirootfs alone does not prove TinyEMU's older
RISC-V hardware/privileged-ISA emulation can boot a current kernel.

Package management will need an intentional networking architecture. In browsers,
there are no raw TCP sockets or native TUN/TAP: implement a lawful, user-owned
WebSocket TCP gateway or a compatible browser proxy. Never rely on a third-party
public VPN merely to claim no strings attached. An offline repository bundle
could cover common packages, subject to storage limits.

## Milestone 3: native vs WASM benchmark

Benchmark same architecture, guest image and workload on iPhone against
UTM SE and iSH: kernel boot time, shell latency, Python, Git, a C build,
filesystem I/O and battery. TinyEMU is small but isn't automatically faster.

## Milestone 4: native iOS frontend (optional)

Native TinyEMU arm64 + SwiftTerm + Files integration would avoid browser storage
and SW lifecycle constraints but requires code signing/distribution and a build
environment. It would still lack ordinary iOS JIT access.

## Important limitations

- Standard iOS apps and Safari are suspended in the background; no always-on VM.
- This initial 2019 guest is a proof of real Linux boot, not a modern daily driver.
- Source for Bellard's public TinyEMU is MIT; the hosted 2026 x86-64 JSLinux
  implementation is not automatically part of this source release.
- Cross-origin network features and local persistence must be engineered and tested.
