export default function removeTags(str: string) {
    if ((str === null) || (str === ''))
        return false;
    else
        str = str.toString();

    //https://www.geeksforgeeks.org/how-to-strip-out-html-tags-from-a-string-using-javascript/

    // Regular expression to identify HTML tags in
    // the input string. Replacing the identified
    // HTML tag with a null string.
    return str.replace(/(<([^>]+)>)/ig, '');
}