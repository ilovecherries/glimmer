/**
 * @vitest-environment
 */

import { describe, it, expect } from "vitest";
import { mount, shallowMount } from "@vue/test-utils";
import SearchArea from "./SearchArea.vue";

describe("Search Area Tests", () => {
  it("should render", () => {
    const wrapper = mount(SearchArea);
    expect(wrapper.exists());
  });
});
