#!/usr/bin/env bash
# process-showcase-media.sh
# Single source of truth for all showcase media.
# - Copies/converts videos and images from content/showcase/<slug>/ to public/
# - Extracts a thumbnail from video if no image is present
# - Resizes the placeholder image once
# - Cleans up public media whose slug no longer exists in content
# - Updates index.md frontmatter with correct image/video paths
#
# Usage: ./scripts/process-showcase-media.sh
# Requires: ffmpeg, ImageMagick (magick)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_TARGET="${BUILD_TARGET:-default}"
if [ "$BUILD_TARGET" = "default" ]; then
  CONTENT_DIR="$SCRIPT_DIR/../content/showcase"
else
  CONTENT_DIR="$SCRIPT_DIR/../content/${BUILD_TARGET}-showcase"
fi
PUBLIC_DIR="$SCRIPT_DIR/../public"
IMG_DIR="$PUBLIC_DIR/images/showcase"
VID_DIR="$PUBLIC_DIR/videos/showcase"
if [ "$BUILD_TARGET" = "default" ]; then
  PLACEHOLDER_SRC="$SCRIPT_DIR/../content/showcase/toffekerels_showcase_placeholder.png"
  PLACEHOLDER_OUT="$IMG_DIR/placeholder.jpg"
else
  PLACEHOLDER_SRC="$SCRIPT_DIR/../content/${BUILD_TARGET}-showcase/placeholder.png"
  PLACEHOLDER_OUT="$IMG_DIR/placeholder.png"
fi
PLACEHOLDER_WIDTH=800
SEEK="00:00:01"

# BSD sed (macOS) requires -i '', GNU sed (Linux) requires -i without argument
sedi() {
  if sed --version 2>/dev/null | grep -q GNU; then
    sed -i "$@"
  else
    sed -i '' "$@"
  fi
}

mkdir -p "$IMG_DIR" "$VID_DIR"

# ── 1. Render placeholder once ───────────────────────────────────────────────
if [ -f "$PLACEHOLDER_SRC" ]; then
  if [ ! -f "$PLACEHOLDER_OUT" ]; then
    echo "PLACEHOLDER → rendering $PLACEHOLDER_OUT"
    magick "$PLACEHOLDER_SRC" -resize "${PLACEHOLDER_WIDTH}x>" -quality 85 "$PLACEHOLDER_OUT"
    echo "  OK: $(du -sh "$PLACEHOLDER_OUT" | cut -f1)"
  else
    echo "PLACEHOLDER already rendered, skipping."
  fi
else
  echo "PLACEHOLDER source not found, skipping: $PLACEHOLDER_SRC"
fi

# ── 2. Process each showcase entry ───────────────────────────────────────────
find "$CONTENT_DIR" -name "index.md" | sort | while read -r mdfile; do
  slug=$(basename "$(dirname "$mdfile")")
  dir=$(dirname "$mdfile")

  echo ""
  echo "── $slug ──────────────────────────────────────────"

  # ── Detect local media files ──────────────────────────────────────────────
  local_image=""
  local_video_mp4=""
  local_video_webm=""

  for ext in jpg jpeg png webp; do
    f=$(find "$dir" -maxdepth 1 -iname "*.$ext" | head -1)
    [ -n "$f" ] && local_image="$f" && break
  done

  for f in "$dir"/*.mp4 "$dir"/*.MP4; do
    [ -f "$f" ] && local_video_mp4="$f" && break
  done 2>/dev/null || true

  for f in "$dir"/*.webm "$dir"/*.WEBM; do
    [ -f "$f" ] && local_video_webm="$f" && break
  done 2>/dev/null || true

  # ── Process video files ───────────────────────────────────────────────────
  new_video_path=""

  if [ -n "$local_video_webm" ]; then
    out="$VID_DIR/${slug}.webm"
    if [ ! -f "$out" ]; then
      echo "  VIDEO (webm) → $out"
      cp "$local_video_webm" "$out"
      echo "    OK: $(du -sh "$out" | cut -f1)"
    else
      echo "  VIDEO (webm) already rendered, skipping."
    fi
    new_video_path="/videos/showcase/${slug}.webm"
  fi

  if [ -n "$local_video_mp4" ]; then
    out="$VID_DIR/${slug}.mp4"
    if [ ! -f "$out" ]; then
      echo "  VIDEO (mp4) → $out"
      cp "$local_video_mp4" "$out"
      echo "    OK: $(du -sh "$out" | cut -f1)"
    else
      echo "  VIDEO (mp4) already rendered, skipping."
    fi
    # Prefer webm as primary video reference; mp4 is secondary
    [ -z "$new_video_path" ] && new_video_path="/videos/showcase/${slug}.mp4"
  fi

  # ── Process image file ────────────────────────────────────────────────────
  new_image_path=""
  new_vertical=""

  if [ -n "$local_image" ]; then
    out="$IMG_DIR/${slug}.jpg"
    if [ ! -f "$out" ]; then
      echo "  IMAGE → $out"
      magick "$local_image" -resize "800x>" -quality 85 "$out"
      echo "    OK: $(du -sh "$out" | cut -f1)"
    else
      echo "  IMAGE already rendered, skipping."
    fi
    new_image_path="/images/showcase/${slug}.jpg"

    # Detect vertical/portrait orientation
    dims=$(magick identify -format "%wx%h" "$local_image" 2>/dev/null || true)
    if [ -n "$dims" ]; then
      w=$(echo "$dims" | cut -dx -f1)
      h=$(echo "$dims" | cut -dx -f2)
      if [ "$h" -gt "$w" ] 2>/dev/null; then
        new_vertical="true"
        echo "    Portrait detected (${w}x${h}) → vertical: true"
      fi
    fi

  elif [ -n "$new_video_path" ]; then
    # No local image — extract thumbnail from video
    out="$IMG_DIR/${slug}.jpg"
    if [ ! -f "$out" ]; then
      video_file=""
      [ -n "$local_video_webm" ] && video_file="$local_video_webm"
      [ -z "$video_file" ] && [ -n "$local_video_mp4" ] && video_file="$local_video_mp4"
      echo "  THUMB from video → $out"
      ffmpeg -y -i "$video_file" -ss "$SEEK" -vframes 1 -vf "scale=800:-1" "$out" 2>/dev/null && \
        echo "    OK: $(du -sh "$out" | cut -f1)" || echo "    FAILED"
    else
      echo "  THUMB already rendered, skipping."
    fi
    new_image_path="/images/showcase/${slug}.jpg"
  else
    echo "  No local media found — will use placeholder fallback."
    if [ "$BUILD_TARGET" = "default" ]; then
      new_image_path="/images/showcase/placeholder.jpg"
    else
      new_image_path="/images/showcase/placeholder.png"
    fi
  fi

  # ── Update frontmatter ────────────────────────────────────────────────────
  cur_image=$(grep "^image:" "$mdfile" | head -1 | sed 's/^image: *//;s/^"//;s/"$//' || true)
  cur_video=$(grep "^video:" "$mdfile" | head -1 | sed 's/^video: *//;s/^"//;s/"$//' || true)
  cur_vertical=$(grep "^vertical:" "$mdfile" | head -1 | sed 's/^vertical: *//;s/^"//;s/"$//' || true)

  # Update image
  if [ -n "$new_image_path" ]; then
    if [ -z "$cur_image" ]; then
      sedi "/^title:/a\\
image: \"$new_image_path\"
" "$mdfile"
      echo "  Frontmatter: added image: $new_image_path"
    elif [ "$cur_image" != "$new_image_path" ]; then
      sedi "s|image: \"$cur_image\"|image: \"$new_image_path\"|" "$mdfile"
      echo "  Frontmatter: updated image: $cur_image → $new_image_path"
    fi
  fi

  # Update video (prefer webm path)
  if [ -n "$new_video_path" ] && [ "$cur_video" != "$new_video_path" ]; then
    if [ -z "$cur_video" ]; then
      sedi "/^title:/a\\
video: \"$new_video_path\"
" "$mdfile"
      echo "  Frontmatter: added video: $new_video_path"
    else
      sedi "s|video: \"$cur_video\"|video: \"$new_video_path\"|" "$mdfile"
      echo "  Frontmatter: updated video: $cur_video → $new_video_path"
    fi
  fi

  # Update vertical flag
  if [ "$new_vertical" = "true" ] && [ "$cur_vertical" != "true" ]; then
    if [ -z "$cur_vertical" ]; then
      sedi "/^title:/a\\
vertical: true
" "$mdfile"
      echo "  Frontmatter: added vertical: true"
    else
      sedi "s|^vertical:.*|vertical: true|" "$mdfile"
    fi
  fi

done

# ── 3. Cleanup: remove public media whose slug no longer exists in ANY target ──
echo ""
echo "── Cleanup ──────────────────────────────────────────"

# Collect valid slugs from ALL showcase content directories so we never
# delete media that belongs to a different build target.
all_valid_slugs=$(find "$SCRIPT_DIR/../content" -maxdepth 3 -name "index.md" \
  | grep -E "/(showcase|[^/]+-showcase)/" \
  | xargs -I{} dirname {} \
  | xargs -I{} basename {})

for f in "$IMG_DIR"/*.jpg "$IMG_DIR"/*.webp; do
  [ -f "$f" ] || continue
  fname=$(basename "$f")
  base="${fname%.*}"
  [ "$base" = "placeholder" ] && continue
  if ! echo "$all_valid_slugs" | grep -qx "$base"; then
    echo "  REMOVE stale image: $f"
    rm "$f"
  fi
done

for f in "$VID_DIR"/*; do
  [ -f "$f" ] || continue
  fname=$(basename "$f")
  base="${fname%.*}"
  if ! echo "$all_valid_slugs" | grep -qx "$base"; then
    echo "  REMOVE stale video: $f"
    rm "$f"
  fi
done

echo ""
echo "Done."
echo "  Images : $(ls "$IMG_DIR" | wc -l | tr -d ' ') files in $IMG_DIR"
echo "  Videos : $(ls "$VID_DIR" | wc -l | tr -d ' ') files in $VID_DIR"
