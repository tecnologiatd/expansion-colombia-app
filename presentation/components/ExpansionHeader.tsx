import React from "react";
import { ThemedText } from "../theme/components/ThemedText";

const ExpansionHeader = () => {
  return (
    <>
      <ThemedText
        type="title"
        className="font-fortuna text-center text-4xl mt-10"
      >
        EXPANSION
      </ThemedText>
      <ThemedText className="font-design-systemc text-center text-2xl">
        COLOMBIA
      </ThemedText>
    </>
  );
};

export default ExpansionHeader;
