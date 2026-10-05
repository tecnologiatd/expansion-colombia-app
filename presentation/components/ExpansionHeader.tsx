import React from "react";
import { ThemedText } from "../theme/components/ThemedText";

const ExpansionHeader = () => {
  return (
    <>
      <ThemedText type="title" className="font-fortuna text-center text-4xl">
        EXPANSION
      </ThemedText>
      <ThemedText className="font-design-systemc text-center text-xl tracking-widest text-muted">
        COLOMBIA
      </ThemedText>
    </>
  );
};

export default ExpansionHeader;
