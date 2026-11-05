"use strict";

import { MAX_RATING } from "../services/utils.js";
import { ICONS } from "./icons.js";

export function createRating(book) {
  const wrapper = document.createElement("div");
  wrapper.className = "rating";
  wrapper.setAttribute("role", "group");
  wrapper.setAttribute("aria-label", `Rating buku: ${book.rating} dari ${MAX_RATING}`);
  for (let value = 1; value <= MAX_RATING; value++) {
    const star = document.createElement("button");
    star.type = "button";
    star.className = `star${value <= book.rating ? " is-active" : ""}`;
    star.dataset.action = "rate";
    star.dataset.value = value;
    star.setAttribute("aria-label", `Beri rating ${value} dari ${MAX_RATING}`);
    star.innerHTML = ICONS.star;
    wrapper.append(star);
  }
  return wrapper;
}
