/**
 * @vitest-environment
 */

import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import MarkupRender from "./MarkupRender.vue";

describe("Markup Renderer Tests", () => {
  it("should render given output", async () => {
    const wrapper = mount(MarkupRender);
    await wrapper.setProps({
      content: "Hello, World!",
    });
    expect(wrapper.text()).toEqual("Hello, World!");
  });

  it("should render updated output", async () => {
    const wrapper = mount(MarkupRender);
    await wrapper.setProps({
      content: "Hello, World!",
    });
    await wrapper.setProps({
      content: "**owo**",
      lang: "12y2",
    });
    expect(wrapper.find("b"));
  });
});
