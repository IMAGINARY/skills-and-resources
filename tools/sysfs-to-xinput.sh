#!/usr/bin/env bash
#
# sysfs-to-xinput.sh — Map a physical sysfs device path to its xinput device ID(s).
#
# Usage:
#   sysfs-to-xinput.sh [-v|--verbose] <sysfs-path>
#
# Arguments:
#   <sysfs-path>   Sysfs path of the physical device, e.g.
#                  /sys/devices/pci0000:00/0000:00:14.0/usb1/1-2
#
# Options:
#   -v, --verbose  Print xinput ID, device node, and device name per match
#                  (default: print xinput IDs only, one per line)
#
# Exit codes:
#   0  At least one matching xinput device was found
#   1  Usage or argument error
#   2  No matching xinput devices found
#
# Dependencies: udevadm, xinput

set -euo pipefail

verbose=0
sysfs_path=""

# --- Parse arguments ---

while [[ $# -gt 0 ]]; do
	case "$1" in
	-v | --verbose)
		verbose=1
		shift
		;;
	-h | --help)
		sed -n '2,/^$/{ s/^# \?//; p }' "$0"
		exit 0
		;;
	-*)
		echo "Unknown option: $1" >&2
		echo "Usage: $(basename "$0") [-v|--verbose] <sysfs-path>" >&2
		exit 1
		;;
	*)
		if [[ -n "$sysfs_path" ]]; then
			echo "Error: unexpected extra argument: $1" >&2
			echo "Usage: $(basename "$0") [-v|--verbose] <sysfs-path>" >&2
			exit 1
		fi
		sysfs_path="$1"
		shift
		;;
	esac
done

if [[ -z "$sysfs_path" ]]; then
	echo "Error: sysfs path argument is required." >&2
	echo "Usage: $(basename "$0") [-v|--verbose] <sysfs-path>" >&2
	exit 1
fi

# --- Check dependencies ---

for cmd in udevadm xinput; do
	if ! command -v "$cmd" &>/dev/null; then
		echo "Error: '$cmd' is not installed or not in PATH." >&2
		exit 1
	fi
done

# --- Validate sysfs path ---

if [[ ! -d "$sysfs_path" ]]; then
	echo "Error: '$sysfs_path' is not a directory." >&2
	exit 1
fi

# Normalize: resolve to canonical path and strip trailing slash
sysfs_path="$(realpath "$sysfs_path")"
sysfs_path="${sysfs_path%/}"

# --- Step 1: Find /dev/input/event* nodes under the given sysfs path ---

matching_devs=()

for dev in /dev/input/event*; do
	[[ -e "$dev" ]] || continue
	dev_syspath=$(udevadm info --query=path --name="$dev" 2>/dev/null) || continue
	# udevadm --query=path returns paths relative to /sys, e.g.
	# /devices/pci0000:00/.../input/input5/event5
	# Prepend /sys for a full path and resolve it.
	full_syspath="/sys${dev_syspath}"
	full_syspath="$(realpath "$full_syspath" 2>/dev/null)" || continue

	# Prefix match: the event device's sysfs path must start with the target path
	if [[ "$full_syspath" == "$sysfs_path"/* ]]; then
		matching_devs+=("$dev")
	fi
done

if [[ ${#matching_devs[@]} -eq 0 ]]; then
	echo "No /dev/input/event* nodes found under sysfs path: $sysfs_path" >&2
	exit 2
fi

# --- Step 2: Map event nodes to xinput IDs ---

found=0

# Collect all xinput IDs once
mapfile -t xinput_ids < <(xinput list --id-only 2>/dev/null)

for dev in "${matching_devs[@]}"; do
	for xid in "${xinput_ids[@]}"; do
		node=$(xinput list-props "$xid" 2>/dev/null |
			grep "Device Node" |
			head -n1 |
			cut -d'"' -f2) || continue
		if [[ "$node" == "$dev" ]]; then
			found=1
			if [[ $verbose -eq 1 ]]; then
				name=$(xinput list --name-only "$xid" 2>/dev/null || echo "unknown")
				printf "%s\t%s\t%s\n" "$xid" "$dev" "$name"
			else
				echo "$xid"
			fi
		fi
	done
done

if [[ $found -eq 0 ]]; then
	echo "Event nodes found (${matching_devs[*]}) but no matching xinput devices." >&2
	exit 2
fi
