import React from "react";
import { TextInput, StyleSheet, TextInputProps } from "react-native";

interface Props extends TextInputProps {
  placeholder: string;
}

export default function Input({ placeholder, ...props }: Props) {
  return <TextInput style={styles.input} placeholder={placeholder} {...props} />;
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 6,
    marginVertical: 8,
  },
});
